import json
import os
import time
import random
import threading

import pika
import httpx
from prometheus_client import (
    Counter, Histogram, Gauge, start_http_server
)

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
INVENTORY_URL = os.getenv("INVENTORY_URL", "http://inventory-service:8002")
PAYMENT_URL = os.getenv("PAYMENT_URL", "http://payment-service:8003")

# Prometheus metrics
messages_processed = Counter(
    "worker_messages_processed_total", "Messages processed", ["result"]
)
processing_duration = Histogram(
    "worker_processing_duration_seconds", "Time to process a message",
    buckets=[0.1, 0.5, 1, 2, 5, 10]
)
queue_depth = Gauge(
    "worker_queue_depth", "Approximate queue depth"
)
retries_total = Counter(
    "worker_retries_total", "Number of message retries"
)
worker_idle = Gauge(
    "worker_idle_seconds", "Time worker spent idle waiting for messages"
)


def update_queue_depth():
    """Periodically check queue depth using its own connection."""
    while True:
        try:
            conn = pika.BlockingConnection(
                pika.ConnectionParameters(host=RABBITMQ_HOST)
            )
            ch = conn.channel()
            q = ch.queue_declare(queue="orders", durable=True, passive=True)
            queue_depth.set(q.method.message_count)
            conn.close()
        except Exception:
            pass
        time.sleep(5)


def fulfill_order(order: dict) -> bool:
    """Process an order: reserve inventory, then process payment."""
    with httpx.Client(timeout=10) as client:
        # Step 1: Reserve inventory
        try:
            resp = client.post(
                f"{INVENTORY_URL}/inventory/{order['product']}/reserve",
                params={"quantity": order["quantity"]},
            )
            if resp.status_code != 200:
                return False
        except httpx.RequestError:
            return False

        # Step 2: Process payment
        try:
            resp = client.post(
                f"{PAYMENT_URL}/payments",
                params={
                    "order_id": order["order_id"],
                    "amount": order["total"],
                },
            )
            if resp.status_code != 200:
                # Rollback: restock inventory
                client.post(
                    f"{INVENTORY_URL}/inventory/{order['product']}/restock",
                    params={"quantity": order["quantity"]},
                )
                return False
        except httpx.RequestError:
            client.post(
                f"{INVENTORY_URL}/inventory/{order['product']}/restock",
                params={"quantity": order["quantity"]},
            )
            return False

    # Simulate packing/shipping delay
    time.sleep(random.uniform(0.1, 1.0))
    return True


def on_message(ch, method, properties, body):
    start = time.time()
    order = json.loads(body)
    print(f"Processing order {order['order_id']}...")

    success = fulfill_order(order)

    if success:
        messages_processed.labels(result="success").inc()
        print(f"Order {order['order_id']} fulfilled successfully")
    else:
        messages_processed.labels(result="failed").inc()
        print(f"Order {order['order_id']} fulfillment failed")

    processing_duration.observe(time.time() - start)
    ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    # Start Prometheus metrics server on port 8004
    start_http_server(8004)
    print("Metrics server started on port 8004")

    # Wait for RabbitMQ to be ready
    while True:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=RABBITMQ_HOST)
            )
            break
        except Exception:
            print("Waiting for RabbitMQ...")
            time.sleep(5)

    channel = connection.channel()
    channel.queue_declare(queue="orders", durable=True)
    channel.basic_qos(prefetch_count=1)

    # Start queue depth monitor in background (uses its own connection)
    monitor = threading.Thread(
        target=update_queue_depth, daemon=True
    )
    monitor.start()

    print("Fulfillment worker ready. Waiting for orders...")
    channel.basic_consume(queue="orders", on_message_callback=on_message)
    channel.start_consuming()


if __name__ == "__main__":
    main()
