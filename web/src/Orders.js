import React, { useState, useEffect } from 'react';

const PRODUCTS = ['Widget', 'Gadget', 'Gizmo', 'Doohickey', 'Thingamajig'];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [product, setProduct] = useState('Widget');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(29.99);
  const [message, setMessage] = useState('');

  const fetchOrders = () => {
    fetch('/api/orders/orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const placeOrder = async () => {
    try {
      const resp = await fetch(
        `/api/orders/orders?product=${product}&quantity=${quantity}&price=${price}`,
        { method: 'POST' }
      );
      const data = await resp.json();
      if (resp.ok) {
        setMessage(`Order ${data.order_id} created (${data.status})`);
      } else {
        setMessage(`Failed: ${data.detail}`);
      }
      fetchOrders();
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    }
  };

  return (
    <div>
      <h2>Place an Order</h2>
      <div style={styles.form}>
        <label>
          Product:
          <select value={product} onChange={e => setProduct(e.target.value)} style={styles.input}>
            {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>
          Quantity:
          <input type="number" min="1" max="20" value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)} style={styles.input} />
        </label>
        <label>
          Price ($):
          <input type="number" min="1" step="0.01" value={price}
            onChange={e => setPrice(parseFloat(e.target.value) || 0)} style={styles.input} />
        </label>
        <button onClick={placeOrder} style={styles.button}>Place Order</button>
      </div>
      {message && <p style={styles.message}>{message}</p>}

      <h3>Recent Orders</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.order_id}>
              <td>{o.order_id}</td>
              <td>{o.product}</td>
              <td>{o.quantity}</td>
              <td>${o.total}</td>
              <td style={{ color: o.status === 'failed' ? 'red' : 'green' }}>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  form: { display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap', marginBottom: 16 },
  input: { display: 'block', padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', marginTop: 4 },
  button: { padding: '8px 20px', background: '#e65100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' },
  message: { padding: 10, background: '#fff3e0', borderRadius: 4, marginTop: 8 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8 },
};

export default Orders;
