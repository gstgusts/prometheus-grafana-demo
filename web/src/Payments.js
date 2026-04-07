import React, { useState } from 'react';

function Payments() {
  const [amount, setAmount] = useState(49.99);
  const [results, setResults] = useState([]);

  const processPayment = async () => {
    const id = `manual-${Math.floor(Math.random() * 10000)}`;
    try {
      const resp = await fetch(
        `/api/payments/payments?order_id=${id}&amount=${amount}`,
        { method: 'POST' }
      );
      const data = await resp.json();
      setResults(prev => [{
        id,
        amount,
        status: resp.ok ? 'success' : 'failed',
        detail: resp.ok ? `${data.processing_time}s` : data.detail,
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20));
    } catch (e) {
      setResults(prev => [{
        id,
        amount,
        status: 'error',
        detail: e.message,
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20));
    }
  };

  const processBurst = async () => {
    for (let i = 0; i < 10; i++) {
      processPayment();
    }
  };

  return (
    <div>
      <h2>Payment Simulator</h2>
      <p style={{ color: '#666' }}>
        Payments have a ~15% failure rate and random processing delays (50ms-2s).
        Watch the metrics in Grafana!
      </p>
      <div style={styles.form}>
        <label>
          Amount ($):
          <input type="number" min="1" step="0.01" value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            style={styles.input} />
        </label>
        <button onClick={processPayment} style={styles.button}>Process Payment</button>
        <button onClick={processBurst} style={{ ...styles.button, background: '#c62828' }}>
          Burst (10x)
        </button>
      </div>

      <h3>Payment Log</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Time</th><th>Order ID</th><th>Amount</th><th>Status</th><th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td>{r.time}</td>
              <td>{r.id}</td>
              <td>${r.amount}</td>
              <td style={{ color: r.status === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>
                {r.status}
              </td>
              <td>{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  form: { display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap', marginBottom: 16 },
  input: { display: 'block', padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', marginTop: 4, width: 100 },
  button: { padding: '8px 20px', background: '#e65100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8 },
};

export default Payments;
