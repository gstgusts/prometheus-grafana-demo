import React, { useState } from 'react';
import Orders from './Orders';
import Inventory from './Inventory';
import Payments from './Payments';
import Health from './Health';

const TABS = ['Orders', 'Inventory', 'Payments', 'Health'];

const API_BASE = window.location.hostname === 'localhost'
  ? '' : '';

export { API_BASE };

function App() {
  const [tab, setTab] = useState('Orders');

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>E-Commerce Monitoring Demo</h1>
        <p style={styles.subtitle}>
          Generate traffic and observe metrics in{' '}
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={styles.link}>
            Grafana
          </a>{' '}
          and{' '}
          <a href="http://localhost:9090" target="_blank" rel="noreferrer" style={styles.link}>
            Prometheus
          </a>
        </p>
      </header>

      <nav style={styles.nav}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tab === t ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          >
            {t}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {tab === 'Orders' && <Orders />}
        {tab === 'Inventory' && <Inventory />}
        {tab === 'Payments' && <Payments />}
        {tab === 'Health' && <Health />}
      </main>
    </div>
  );
}

const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 900,
    margin: '0 auto',
    padding: 20,
    background: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: '#333',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#e65100',
    fontWeight: 'bold',
  },
  nav: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  tab: {
    padding: '10px 24px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 500,
  },
  activeTab: {
    background: '#e65100',
    color: '#fff',
    border: '1px solid #e65100',
  },
  main: {
    background: '#fff',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

export default App;
