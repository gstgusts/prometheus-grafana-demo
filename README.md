# Prometheus & Grafana Monitoring Demo

A demo project showcasing microservices monitoring with Prometheus and Grafana. Built as a teaching tool for DevOps students to learn observability, metrics collection, and dashboard visualization.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  React SPA  │────▶│  Order Service   │────▶│    RabbitMQ      │
│  :7070      │     │  :8001           │     │  :5672 / :15672  │
│             │────▶│  Inventory Svc   │     └────────┬─────────┘
│             │     │  :8002           │              │
│             │────▶│  Payment Service │     ┌────────▼─────────┐
│             │     │  :8003           │◀────│  Fulfillment     │
└─────────────┘     └─────────────────┘     │  Worker :8004    │
                                             └──────────────────┘
┌─────────────┐     ┌─────────────────┐
│  Prometheus │────▶│  All services    │
│  :9090      │     │  /metrics        │
└──────┬──────┘     └─────────────────┘
       │
┌──────▼──────┐     ┌─────────────────┐
│  Grafana    │     │  Load Generator  │
│  :3000      │     │  (auto-traffic)  │
└─────────────┘     └─────────────────┘
```

## Services

### Order Service (`:8001`)
REST API for placing and listing orders. Publishes each order to a RabbitMQ queue for async fulfillment.

**Metrics:** `orders_total` (counter), `order_amount_dollars` (histogram), `order_processing_seconds` (histogram)

### Inventory Service (`:8002`)
Manages stock levels for 5 products. Supports reserving stock and restocking. Triggers low-stock alerts when quantity drops below 10.

**Metrics:** `inventory_stock_level` (gauge), `inventory_stock_updates_total` (counter), `inventory_low_stock_alerts_total` (counter)

### Payment Service (`:8003`)
Simulates payment processing with random delays (50ms–2s) and a 15% failure rate to generate realistic error metrics.

**Metrics:** `payments_total` (counter), `payment_amount_dollars` (histogram), `payment_processing_duration_seconds` (summary), `payment_retries_total` (counter)

### Fulfillment Worker (`:8004`)
Background worker that consumes orders from RabbitMQ, reserves inventory, processes payment, and simulates shipping. Exposes metrics via a standalone HTTP server (no web framework).

**Metrics:** `worker_messages_processed_total` (counter), `worker_processing_duration_seconds` (histogram), `worker_queue_depth` (gauge), `worker_retries_total` (counter)

### React SPA (`:7070`)
Single-page application with 4 tabs:
- **Orders** — place orders and view recent order history
- **Inventory** — view stock levels and restock products
- **Payments** — simulate individual or burst payments
- **Health** — live health status of all services with links to Prometheus, Grafana, and RabbitMQ

### Load Generator
Runs continuously in the background, sending randomized requests to all three API services. Ensures dashboards always have data flowing, even without manual interaction.

## Infrastructure

| Component | Purpose | URL |
|-----------|---------|-----|
| **Prometheus** | Metrics collection & storage | http://localhost:9090 |
| **Grafana** | Visualization & dashboards | http://localhost:3000 |
| **RabbitMQ** | Message broker for async order processing | http://localhost:15672 |

## Getting Started

```bash
docker compose up -d --build
```

Wait ~30 seconds for all services to start, then open:

- **React SPA** — http://localhost:7070
- **Grafana** — http://localhost:3000 (login: `admin` / `admin`)
- **Prometheus** — http://localhost:9090

A pre-built **E-Commerce Monitoring** dashboard is automatically provisioned in Grafana.

## Prometheus Metric Types Demonstrated

| Type | Example | Description |
|------|---------|-------------|
| **Counter** | `orders_total` | Value that only goes up (total orders placed) |
| **Gauge** | `inventory_stock_level` | Value that goes up and down (current stock) |
| **Histogram** | `order_amount_dollars` | Distribution of values in buckets (order amounts) |
| **Summary** | `payment_processing_duration_seconds` | Percentile tracking (p50, p90, p99 latency) |

## Useful PromQL Queries

```promql
# Orders per second by status
rate(orders_total[1m])

# Payment error rate percentage
rate(payments_total{status="failed"}[5m]) / rate(payments_total[5m]) * 100

# Inventory levels per product
inventory_stock_level

# 90th percentile payment latency
payment_processing_duration_seconds{quantile="0.9"}

# Worker throughput
rate(worker_messages_processed_total[1m])

# Queue depth
worker_queue_depth
```

## Stopping

```bash
docker compose down
```
