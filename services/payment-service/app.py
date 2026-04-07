import random
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Summary, make_asgi_app

app = FastAPI(title="Payment Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
payments_total = Counter(
    "payments_total", "Total payment attempts", ["status"]
)
payment_amount = Histogram(
    "payment_amount_dollars", "Payment amounts",
    buckets=[10, 25, 50, 100, 250, 500, 1000]
)
payment_duration = Summary(
    "payment_processing_duration_seconds",
    "Payment processing duration"
)
payment_retries = Counter(
    "payment_retries_total", "Number of payment retries"
)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

FAILURE_RATE = 0.15  # 15% of payments fail


@app.get("/health")
def health():
    return {"status": "healthy", "service": "payment-service"}


@app.post("/payments")
def process_payment(order_id: str = "unknown", amount: float = 29.99):
    start = time.time()

    # Simulate processing delay (50ms to 2s)
    delay = random.uniform(0.05, 2.0)
    time.sleep(delay)

    # Simulate random failures
    if random.random() < FAILURE_RATE:
        payments_total.labels(status="failed").inc()
        payment_duration.observe(time.time() - start)
        raise HTTPException(
            status_code=402,
            detail="Payment declined"
        )

    payments_total.labels(status="success").inc()
    payment_amount.observe(amount)
    payment_duration.observe(time.time() - start)

    return {
        "order_id": order_id,
        "amount": amount,
        "status": "success",
        "processing_time": round(delay, 3),
    }


@app.post("/payments/retry")
def retry_payment(order_id: str = "unknown", amount: float = 29.99):
    payment_retries.inc()
    return process_payment(order_id=order_id, amount=amount)
