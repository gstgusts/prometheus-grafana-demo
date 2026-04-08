# Prometheus Metrics Per Service

Detailed description of Prometheus configuration and metrics defined in each service.

## Order Service (`:8001`)

**Metrics endpoint:** `make_asgi_app()` mounted at `/metrics` on the FastAPI app

**Library imports:** `Counter`, `Histogram`, `Gauge`

| Metric name | Type | Labels | Where updated | What it tracks |
|---|---|---|---|---|
| `orders_total` | Counter | `status` ("queued", "failed") | `create_order()` — on success or failure | Total orders placed |
| `order_amount_dollars` | Histogram | — | `create_order()` — on success | Distribution of order totals (buckets: $10, $25, $50, $100, $250, $500, $1000) |
| `order_processing_seconds` | Histogram | — | `create_order()` — always | Time from request start to response |
| `orders_in_queue` | Gauge | — | `publish_to_queue()` — on success | Running count of messages published to RabbitMQ |

## Inventory Service (`:8002`)

**Metrics endpoint:** `make_asgi_app()` mounted at `/metrics` on the FastAPI app

**Library imports:** `Gauge`, `Counter`, `Histogram`

| Metric name | Type | Labels | Where updated | What it tracks |
|---|---|---|---|---|
| `inventory_stock_level` | Gauge | `product` | On startup (initial values), `restock()`, `reserve()` | Current stock per product — goes up and down |
| `inventory_stock_updates_total` | Counter | `operation` ("restock", "reserve", "reserve_failed") | `restock()`, `reserve()` | Total stock operations by type |
| `inventory_low_stock_alerts_total` | Counter | — | `reserve()` — when stock < 10 | How many times stock dropped below threshold |
| `inventory_request_duration_seconds` | Histogram | — | `restock()`, `reserve()` | Request processing time |

## Payment Service (`:8003`)

**Metrics endpoint:** `make_asgi_app()` mounted at `/metrics` on the FastAPI app

**Library imports:** `Counter`, `Histogram`, `Summary`

| Metric name | Type | Labels | Where updated | What it tracks |
|---|---|---|---|---|
| `payments_total` | Counter | `status` ("success", "failed") | `process_payment()` — on success or failure | Total payment attempts |
| `payment_amount_dollars` | Histogram | — | `process_payment()` — on success only | Distribution of payment amounts (buckets: $10–$1000) |
| `payment_processing_duration_seconds` | Summary | — | `process_payment()` — always | Latency with auto-calculated percentiles (p50, p90, p99) |
| `payment_retries_total` | Counter | — | `retry_payment()` | How many payments were retried |

## Fulfillment Worker (`:8004`)

**Metrics endpoint:** `start_http_server(8004)` — standalone HTTP server (no web framework)

**Library imports:** `Counter`, `Histogram`, `Gauge`

| Metric name | Type | Labels | Where updated | What it tracks |
|---|---|---|---|---|
| `worker_messages_processed_total` | Counter | `result` ("success", "failed") | `on_message()` — after fulfillment | Total messages consumed from queue |
| `worker_processing_duration_seconds` | Histogram | — | `on_message()` — always | Time to fully process one message (buckets: 0.1s–10s) |
| `worker_queue_depth` | Gauge | — | `update_queue_depth()` — every 5s in background thread | Approximate messages waiting in RabbitMQ |
| `worker_retries_total` | Counter | — | (defined but not yet triggered) | Message retry count |
| `worker_idle_seconds` | Gauge | — | (defined but not yet triggered) | Idle wait time |

## Key Difference in Metrics Exposure

| Service | Method | Why |
|---|---|---|
| Order, Inventory, Payment | `make_asgi_app()` mounted on FastAPI | These are web apps — metrics piggyback on the existing HTTP server |
| Fulfillment Worker | `start_http_server(8004)` | No web framework — starts a dedicated HTTP server just for `/metrics` |

## Prometheus Metric Types Used

| Type | Example | Description |
|---|---|---|
| **Counter** | `orders_total` | Value that only goes up (total orders placed) |
| **Gauge** | `inventory_stock_level` | Value that goes up and down (current stock) |
| **Histogram** | `order_amount_dollars` | Distribution of values in configurable buckets |
| **Summary** | `payment_processing_duration_seconds` | Percentile tracking (p50, p90, p99) calculated client-side |
