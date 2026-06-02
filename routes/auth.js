import express from 'express';
import db from '../db/dbConnection.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const result = await db.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, created_at',
      [name, email, password, role],
    );
    const row = result.rows[0];
    res.status(201).json({
      user: {
        id: row.id,
        name: row.full_name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await db.query(
      'SELECT id, full_name, email, role, password, created_at FROM users WHERE email = $1 AND password = $2',
      [email, password],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const row = result.rows[0];
    res.status(200).json({
      user: {
        id: row.id,
        name: row.full_name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
