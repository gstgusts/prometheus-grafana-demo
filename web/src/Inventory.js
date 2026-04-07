import React, { useState, useEffect } from 'react';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [restockQty, setRestockQty] = useState(50);

  const fetchInventory = () => {
    fetch('/api/inventory/inventory')
      .then(r => r.json())
      .then(setInventory)
      .catch(() => {});
  };

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 3000);
    return () => clearInterval(interval);
  }, []);

  const restock = async (product) => {
    await fetch(`/api/inventory/inventory/${product}/restock?quantity=${restockQty}`, {
      method: 'POST',
    });
    fetchInventory();
  };

  return (
    <div>
      <h2>Inventory Levels</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Restock amount:{' '}
          <input type="number" min="1" value={restockQty}
            onChange={e => setRestockQty(parseInt(e.target.value) || 1)}
            style={styles.input} />
        </label>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Product</th>
            <th style={styles.th}>Stock</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.product}>
              <td style={styles.td}>{item.product}</td>
              <td style={styles.td}>{item.quantity}</td>
              <td style={{ ...styles.td, color: item.low_stock ? 'red' : 'green', fontWeight: 'bold' }}>
                {item.low_stock ? 'LOW STOCK' : 'OK'}
              </td>
              <td style={styles.td}>
                <button onClick={() => restock(item.product)} style={styles.button}>
                  Restock +{restockQty}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  input: { padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', width: 80 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #ddd' },
  td: { padding: '8px 12px', borderBottom: '1px solid #eee' },
  button: { padding: '4px 12px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
};

export default Inventory;
