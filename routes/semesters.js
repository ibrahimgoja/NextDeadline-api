import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { name, season, year } = req.body;
    const result = await db.query(
      'INSERT INTO semesters (user_id, name, season, year) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, season, year],
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      year: row.year,
      season: row.season,
      userId: row.user_id,
      createdAt: row.created_at,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM semesters WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
