import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

async function assertInstructorOwnsCourse(userId, courseId) {
  const result = await db.query(
    'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
    [courseId, userId],
  );
  return result.rows.length > 0;
}

router.post('/', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const { title, description, dueDate, points, courseId } = req.body;
    if (!(await assertInstructorOwnsCourse(req.user.id, courseId))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await db.query(
      'INSERT INTO assignments (course_id, title, description, due_date, points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [courseId, title, description || null, dueDate, points || 0],
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      title: row.title,
      description: row.description,
      courseId: row.course_id,
      dueDate: row.due_date,
      points: row.points,
      createdAt: row.created_at,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const { title, description, dueDate, points, courseId } = req.body;
    const existing = await db.query(
      `SELECT a.* FROM assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE a.id = $1 AND c.instructor_id = $2`,
      [req.params.id, req.user.id],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const row = existing.rows[0];
    const result = await db.query(
      'UPDATE assignments SET title = $1, description = $2, due_date = $3, points = $4, course_id = $5 WHERE id = $6 RETURNING *',
      [
        title ?? row.title,
        description ?? row.description,
        dueDate ?? row.due_date,
        points ?? row.points,
        courseId ?? row.course_id,
        req.params.id,
      ],
    );
    const updated = result.rows[0];
    res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      courseId: updated.course_id,
      dueDate: updated.due_date,
      points: updated.points,
      createdAt: updated.created_at,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM assignments a
       USING courses c
       WHERE a.course_id = c.id AND a.id = $1 AND c.instructor_id = $2
       RETURNING a.id`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
