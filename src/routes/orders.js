const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, l.building_name FROM orders o LEFT JOIN locations l ON o.delivery_location_id = l.id'
    );
    const orders = result.rows;
    for (let order of orders) {
      const items = await pool.query(
        'SELECT oi.*, fi.name, fi.price FROM order_items oi JOIN food_items fi ON oi.food_item_id = fi.id WHERE oi.order_id = $1',
        [order.id]
      );
      order.items = items.rows;
    }
    res.json(orders);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { order_type, table_number, delivery_location_id, customer_name, items } = req.body;
  if (!order_type || !items || items.length === 0) {
    return res.status(400).json({ message: 'Order type and items are required' });
  }
  try {
    const total_price = items.reduce((total, item) => total + (item.quantity * item.price), 0);
    const orderResult = await pool.query(
      'INSERT INTO orders (order_type, table_number, delivery_location_id, customer_name, payment_method, total_price, order_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [order_type, table_number, delivery_location_id, customer_name, 'Pending', total_price, 'in_process']
    );
    const order = orderResult.rows[0];
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, food_item_id, quantity) VALUES ($1, $2, $3)',
        [order.id, item.food_item_id, item.quantity]
      );
    }
    const fullOrder = await pool.query(
      'SELECT o.*, oi.food_item_id, oi.quantity, fi.name, fi.price FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN food_items fi ON oi.food_item_id = fi.id WHERE o.id = $1',
      [order.id]
    );
    const result = fullOrder.rows.reduce((acc, row) => {
      if (!acc.id) {
        acc = { ...row, items: [] };
      }
      if (row.food_item_id) {
        acc.items.push({
          food_item_id: row.food_item_id,
          quantity: row.quantity,
          name: row.name,
          price: row.price
        });
      }
      return acc;
    }, {});
    res.status(201).json(result);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/checkout', authMiddleware, async (req, res) => {
  const { payment_method } = req.body;
  if (!payment_method) return res.status(400).json({ message: 'Payment method is required' });
  try {
    const result = await pool.query(
      'UPDATE orders SET payment_method = $1, order_status = $2 WHERE id = $3 RETURNING *',
      [payment_method, 'completed', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;