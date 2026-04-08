# Alert Rules Exercise

5 alert rules for students to implement in Grafana.

## 1. Low Inventory Stock Alert

| Setting | Value |
|---|---|
| **Query** | `inventory_stock_level` |
| **Condition** | IS BELOW 10 |
| **Folder** | `E-Commerce Alerts` |
| **Labels** | `service=inventory-service`, `severity=warning` |

Fires when any product stock drops below 10 units. Will trigger naturally as the load generator places orders.

## 2. Service Down Alert

| Setting | Value |
|---|---|
| **Query** | `up` |
| **Condition** | IS BELOW 1 |
| **Folder** | `E-Commerce Alerts` |
| **Labels** | `severity=critical` |

Fires when any scrape target becomes unreachable. Test it by stopping a container:

```bash
docker stop payment-service
```

## 3. Queue Backlog Alert

| Setting | Value |
|---|---|
| **Query** | `worker_queue_depth` |
| **Condition** | IS ABOVE 50 |
| **Folder** | `E-Commerce Alerts` |
| **Labels** | `service=fulfillment-worker`, `severity=warning` |

Fires when too many messages pile up in RabbitMQ. Trigger it by stopping the worker while the load generator keeps placing orders:

```bash
docker stop fulfillment-worker
```

## 4. High Payment Latency Alert

| Setting | Value |
|---|---|
| **Query** | `payment_processing_duration_seconds{quantile="0.9"}` |
| **Condition** | IS ABOVE 1.5 |
| **Folder** | `E-Commerce Alerts` |
| **Labels** | `service=payment-service`, `severity=warning` |

Fires when 90th percentile payment processing time exceeds 1.5 seconds. Will trigger naturally due to the random delay (50ms-2s) in the payment service.

## 5. Order Processing Stopped Alert

| Setting | Value |
|---|---|
| **Query** | `rate(worker_messages_processed_total[5m])` |
| **Condition** | IS BELOW 0.01 |
| **Folder** | `E-Commerce Alerts` |
| **Labels** | `service=fulfillment-worker`, `severity=critical` |

Fires when the worker stops processing messages. Trigger it by stopping the worker or RabbitMQ. Tests a "no activity" scenario — important in production to detect silent failures.

## Suggested Exercise Flow

1. Create all 5 alerts in Grafana
2. Observe which ones fire naturally (1 and 4 will likely trigger on their own)
3. Manually trigger the others by stopping containers (`docker stop <service>`)
4. Restart the containers and watch alerts resolve (`docker start <service>`)
