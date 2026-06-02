import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const { name, code, description, color } = req.body;
    const result = await db.query(
      'INSERT INTO courses (instructor_id, code, name, description, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, code, name, description || null, color || '#3B82F6'],
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      instructorId: row.instructor_id,
      color: row.color,
      createdAt: row.created_at,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM courses WHERE id = $1 AND instructor_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
