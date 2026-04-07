import React, { useState, useEffect } from 'react';

const SERVICES = [
  { name: 'Order Service', url: '/api/orders/health' },
  { name: 'Inventory Service', url: '/api/inventory/health' },
  { name: 'Payment Service', url: '/api/payments/health' },
];

function Health() {
  const [statuses, setStatuses] = useState({});
  const [lastCheck, setLastCheck] = useState('');

  const checkHealth = async () => {
    const results = {};
    for (const svc of SERVICES) {
      try {
        const resp = await fetch(svc.url);
        const data = await resp.json();
        results[svc.name] = { status: 'healthy', detail: data };
      } catch {
        results[svc.name] = { status: 'unhealthy', detail: null };
      }
    }
    setStatuses(results);
    setLastCheck(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Service Health</h2>
      <p style={{ color: '#666' }}>Auto-refreshes every 5 seconds. Last check: {lastCheck}</p>

      <div style={styles.grid}>
        {SERVICES.map(svc => {
          const s = statuses[svc.name];
          const healthy = s?.status === 'healthy';
          return (
            <div key={svc.name} style={{ ...styles.card, borderColor: healthy ? '#4caf50' : '#f44336' }}>
              <div style={{ ...styles.dot, background: healthy ? '#4caf50' : '#f44336' }} />
              <h3 style={{ margin: '8px 0 4px' }}>{svc.name}</h3>
              <p style={{ margin: 0, color: healthy ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                {healthy ? 'Healthy' : 'Unhealthy'}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Quick Links</h3>
        <ul>
          <li><a href="http://localhost:9090/targets" target="_blank" rel="noreferrer">Prometheus Targets</a></li>
          <li><a href="http://localhost:3000" target="_blank" rel="noreferrer">Grafana Dashboard</a></li>
          <li><a href="http://localhost:15672" target="_blank" rel="noreferrer">RabbitMQ Management (guest/guest)</a></li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  card: {
    padding: 20,
    borderRadius: 8,
    border: '2px solid',
    textAlign: 'center',
    background: '#fafafa',
  },
  dot: { width: 16, height: 16, borderRadius: '50%', margin: '0 auto' },
};

export default Health;
