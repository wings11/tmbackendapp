const express = require('express');
    const router = express.Router();
    const pool = require('../db');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    require('dotenv').config();

    // Middleware to verify JWT
    const authMiddleware = (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Unauthorized' });
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
      });
    };

    router.post('/login', async (req, res) => {
      const { username, password } = req.body;
      try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.role });
      } catch (err) {
        console.error('Login error:', err.stack); // Add detailed logging
        res.status(500).json({ message: 'Server error', error: err.message }); // Return error details
      }
    });

    // Export both the router and the middleware
    module.exports = { router, authMiddleware };