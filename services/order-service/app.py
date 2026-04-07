import json
import os
import time
import uuid

import pika
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, make_asgi_app

app = FastAPI(title="Order Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
orders_total = Counter(
    "orders_total", "Total number of orders", ["status"]
)
order_amount = Histogram(
    "order_amount_dollars", "Order amount in dollars",
    buckets=[10, 25, 50, 100, 250, 500, 1000]
)
order_processing_seconds = Histogram(
    "order_processing_seconds", "Time spent processing an order"
)
orders_in_queue = Gauge(
    "orders_in_queue", "Number of orders published to the queue"
)

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# In-memory order store
orders = {}

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")


def publish_to_queue(order: dict):
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )
        channel = connection.channel()
        channel.queue_declare(queue="orders", durable=True)
        channel.basic_publish(
            exchange="",
            routing_key="orders",
            body=json.dumps(order),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        connection.close()
        orders_in_queue.inc()
        return True
    except Exception:
        return False


@app.get("/health")
def health():
    return {"status": "healthy", "service": "order-service"}


@app.post("/orders")
def create_order(product: str = "Widget", quantity: int = 1, price: float = 29.99):
    start = time.time()

    order_id = str(uuid.uuid4())[:8]
    total = round(price * quantity, 2)

    order = {
        "order_id": order_id,
        "product": product,
        "quantity": quantity,
        "price": price,
        "total": total,
        "status": "pending",
    }

    published = publish_to_queue(order)
    if not published:
        order["status"] = "failed"
        orders_total.labels(status="failed").inc()
        order_processing_seconds.observe(time.time() - start)
        raise HTTPException(status_code=503, detail="Could not queue order")

    order["status"] = "queued"
    orders[order_id] = order

    orders_total.labels(status="queued").inc()
    order_amount.observe(total)
    order_processing_seconds.observe(time.time() - start)

    return order


@app.get("/orders")
def list_orders():
    return list(orders.values())[-20:]


@app.get("/orders/{order_id}")
def get_order(order_id: str):
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders[order_id]
