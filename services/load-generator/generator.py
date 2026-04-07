import random
import time

import httpx

ORDER_URL = "http://order-service:8001"
INVENTORY_URL = "http://inventory-service:8002"
PAYMENT_URL = "http://payment-service:8003"

PRODUCTS = ["Widget", "Gadget", "Gizmo", "Doohickey", "Thingamajig"]


def generate_load():
    client = httpx.Client(timeout=10)

    print("Load generator started. Generating traffic...")

    while True:
        try:
            action = random.choices(
                ["order", "check_inventory", "restock", "direct_payment"],
                weights=[50, 25, 10, 15],
            )[0]

            product = random.choice(PRODUCTS)

            if action == "order":
                quantity = random.randint(1, 5)
                price = round(random.uniform(9.99, 199.99), 2)
                resp = client.post(
                    f"{ORDER_URL}/orders",
                    params={
                        "product": product,
                        "quantity": quantity,
                        "price": price,
                    },
                )
                print(f"Order: {product} x{quantity} @ ${price} -> {resp.status_code}")

            elif action == "check_inventory":
                resp = client.get(f"{INVENTORY_URL}/inventory/{product}")
                data = resp.json()
                print(f"Stock check: {product} -> {data.get('quantity', '?')} units")

            elif action == "restock":
                qty = random.randint(10, 100)
                resp = client.post(
                    f"{INVENTORY_URL}/inventory/{product}/restock",
                    params={"quantity": qty},
                )
                print(f"Restock: {product} +{qty} -> {resp.status_code}")

            elif action == "direct_payment":
                amount = round(random.uniform(10, 500), 2)
                resp = client.post(
                    f"{PAYMENT_URL}/payments",
                    params={"order_id": f"direct-{random.randint(1000,9999)}", "amount": amount},
                )
                print(f"Payment: ${amount} -> {resp.status_code}")

        except Exception as e:
            print(f"Error: {e}")

        # Random delay between requests (0.5s to 3s)
        time.sleep(random.uniform(0.5, 3.0))


if __name__ == "__main__":
    # Wait for services to be ready
    print("Waiting for services to start...")
    time.sleep(15)
    generate_load()
