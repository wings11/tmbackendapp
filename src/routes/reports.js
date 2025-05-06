const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

router.get('/sales-summary', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(total_price) AS total_sales, COUNT(*) AS total_orders FROM orders');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;