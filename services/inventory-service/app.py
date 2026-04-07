import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Gauge, Counter, Histogram, make_asgi_app

app = FastAPI(title="Inventory Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
stock_level = Gauge(
    "inventory_stock_level", "Current stock level", ["product"]
)
stock_updates_total = Counter(
    "inventory_stock_updates_total", "Total stock updates", ["operation"]
)
low_stock_alerts = Counter(
    "inventory_low_stock_alerts_total", "Number of low stock alerts triggered"
)
request_duration = Histogram(
    "inventory_request_duration_seconds", "Request duration"
)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

LOW_STOCK_THRESHOLD = 10

# In-memory inventory
inventory = {
    "Widget": 100,
    "Gadget": 50,
    "Gizmo": 75,
    "Doohickey": 30,
    "Thingamajig": 60,
}

# Initialize stock gauges
for product, qty in inventory.items():
    stock_level.labels(product=product).set(qty)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "inventory-service"}


@app.get("/inventory")
def list_inventory():
    return [
        {"product": p, "quantity": q, "low_stock": q < LOW_STOCK_THRESHOLD}
        for p, q in inventory.items()
    ]


@app.get("/inventory/{product}")
def get_product(product: str):
    if product not in inventory:
        raise HTTPException(status_code=404, detail="Product not found")
    qty = inventory[product]
    return {"product": product, "quantity": qty, "low_stock": qty < LOW_STOCK_THRESHOLD}


@app.post("/inventory/{product}/restock")
def restock(product: str, quantity: int = 50):
    start = time.time()
    if product not in inventory:
        raise HTTPException(status_code=404, detail="Product not found")

    inventory[product] += quantity
    stock_level.labels(product=product).set(inventory[product])
    stock_updates_total.labels(operation="restock").inc()
    request_duration.observe(time.time() - start)

    return {"product": product, "quantity": inventory[product]}


@app.post("/inventory/{product}/reserve")
def reserve(product: str, quantity: int = 1):
    start = time.time()
    if product not in inventory:
        raise HTTPException(status_code=404, detail="Product not found")
    if inventory[product] < quantity:
        stock_updates_total.labels(operation="reserve_failed").inc()
        request_duration.observe(time.time() - start)
        raise HTTPException(status_code=409, detail="Insufficient stock")

    inventory[product] -= quantity
    stock_level.labels(product=product).set(inventory[product])
    stock_updates_total.labels(operation="reserve").inc()

    if inventory[product] < LOW_STOCK_THRESHOLD:
        low_stock_alerts.inc()

    request_duration.observe(time.time() - start)
    return {"product": product, "quantity": inventory[product]}
