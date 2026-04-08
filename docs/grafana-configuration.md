# Grafana Default Configuration

Grafana is auto-configured on startup via provisioning files mounted from `grafana/provisioning/`.

## Datasource (datasource.yml)

| Setting | Value |
|---|---|
| Name | Prometheus |
| Type | `prometheus` |
| UID | `prometheus-ds` |
| URL | `http://prometheus:9090` |
| Default | Yes |
| Editable | Yes |

Grafana connects to Prometheus automatically — no manual setup needed.

## Dashboard (ecommerce.json)

**"E-Commerce Monitoring"** dashboard with 8 panels:

| # | Panel | Type | Query | Visualization |
|---|---|---|---|---|
| 1 | Orders per Second | timeseries | `rate(orders_total[1m])` | Line chart, split by status |
| 2 | Payment Success vs Failure | timeseries | `rate(payments_total[1m])` | Line chart, split by status |
| 3 | Inventory Stock Levels | gauge | `inventory_stock_level` | Gauge per product (red <10, orange <30, green 30+) |
| 4 | Payment Duration | timeseries | `payment_processing_duration_seconds{quantile="0.5/0.9/0.99"}` | 3 lines: p50, p90, p99 |
| 5 | Worker Messages Processed | timeseries | `rate(worker_messages_processed_total[1m])` | Bar chart, split by result |
| 6 | Worker Queue Depth | timeseries | `worker_queue_depth` | Line chart with thresholds (green <50, orange <100, red 100+) |
| 7 | Order Amount Distribution | histogram | `rate(order_amount_dollars_bucket[5m])` | Histogram of order amounts |
| 8 | Service Health | stat | `up` | Stat panel: "UP" (green) or "DOWN" (red) per job |

### Dashboard Settings

- **Auto-refresh:** every 5 seconds
- **Default time range:** last 15 minutes
- **Tags:** `demo`

## Provisioning Loader (dashboards.yml)

Tells Grafana to load all JSON dashboard files from `/etc/grafana/provisioning/dashboards` on startup. Any new `.json` file added to that folder will automatically appear in Grafana.

## How Provisioning Works

The `docker-compose.yaml` mounts the local folder into the container:

```yaml
grafana:
  volumes:
    - ./grafana/provisioning:/etc/grafana/provisioning
```

On startup, Grafana reads:
1. `provisioning/datasources/*.yml` — creates data source connections
2. `provisioning/dashboards/dashboards.yml` — tells Grafana where to find dashboard JSON files
3. `provisioning/dashboards/*.json` — loads each file as a dashboard
