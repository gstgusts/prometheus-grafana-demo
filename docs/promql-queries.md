# PromQL Queries Used in Grafana Dashboard

All PromQL queries defined in the pre-built "E-Commerce Monitoring" Grafana dashboard.

## Dashboard Panels

| # | Panel | Query | What it does |
|---|---|---|---|
| 1 | **Orders per Second** | `rate(orders_total[1m])` | Per-second rate of orders over the last 1 minute, split by `status` label (queued/failed) |
| 2 | **Payment Success vs Failure** | `rate(payments_total[1m])` | Per-second rate of payments, split by `status` label (success/failed) |
| 3 | **Inventory Stock Levels** | `inventory_stock_level` | Raw gauge value — current stock per product, no function needed since it already represents the current state |
| 4 | **Payment Duration (p50)** | `payment_processing_duration_seconds{quantile="0.5"}` | p50 (median) latency from the Summary metric |
| 4 | **Payment Duration (p90)** | `payment_processing_duration_seconds{quantile="0.9"}` | p90 latency — 90% of payments are faster than this |
| 4 | **Payment Duration (p99)** | `payment_processing_duration_seconds{quantile="0.99"}` | p99 latency — worst-case excluding outliers |
| 5 | **Worker Messages Processed** | `rate(worker_messages_processed_total[1m])` | Per-second rate of messages processed by the worker, split by `result` (success/failed) |
| 6 | **Worker Queue Depth** | `worker_queue_depth` | Raw gauge — how many messages are waiting in RabbitMQ right now |
| 7 | **Order Amount Distribution** | `rate(order_amount_dollars_bucket[5m])` | Rate of histogram bucket changes — shows how order amounts distribute across price ranges |
| 8 | **Service Health** | `up` | Built-in Prometheus metric — `1` if scrape target is reachable, `0` if down, per `job` label |

## Key PromQL Functions

### `rate(counter[duration])`

Converts a counter (ever-increasing total) into a per-second rate over a time window. Without `rate()`, a counter just grows forever and isn't useful for graphs.

```promql
rate(orders_total[1m])        # orders per second over last 1 minute
rate(payments_total[1m])      # payments per second over last 1 minute
```

### Label filters `{label="value"}`

Select specific time series by label value.

```promql
payment_processing_duration_seconds{quantile="0.9"}   # select p90 percentile
payments_total{status="failed"}                        # select only failed payments
```

### Raw value (no function)

Used for Gauge metrics since they already represent the current state.

```promql
inventory_stock_level    # current stock per product
worker_queue_depth       # current messages in queue
up                       # 1 = target reachable, 0 = down
```

## Additional Useful Queries

These are not in the dashboard but can be used in Prometheus UI or added to Grafana:

```promql
# Payment error rate as percentage
rate(payments_total{status="failed"}[5m]) / rate(payments_total[5m]) * 100

# Total orders in the last hour
increase(orders_total[1h])

# Average order processing time
rate(order_processing_seconds_sum[5m]) / rate(order_processing_seconds_count[5m])

# Products with low stock (below 10)
inventory_stock_level < 10

# Worker processing time 95th percentile (from histogram)
histogram_quantile(0.95, rate(worker_processing_duration_seconds_bucket[5m]))
```
