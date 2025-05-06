const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations');
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { building_name } = req.body;
  if (!building_name) return res.status(400).json({ message: 'Building name is required' });
  try {
    const result = await pool.query(
      'INSERT INTO locations (building_name) VALUES ($1) RETURNING *',
      [building_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { building_name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE locations SET building_name = $1 WHERE id = $2 RETURNING *',
      [building_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Location not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Location not found' });
    res.json({ message: 'Location deleted' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;