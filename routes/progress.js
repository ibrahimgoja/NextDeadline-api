import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = express.Router();

router.put('/:assignmentId', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const assignmentId = req.params.assignmentId;

    const enrolled = await db.query(
      `SELECT a.id FROM assignments a
       JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = $1
       WHERE a.id = $2`,
      [req.user.id, assignmentId],
    );
    if (enrolled.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const completedAt = status === 'Completed' ? new Date() : null;
    const result = await db.query(
      `INSERT INTO assignment_progress (assignment_id, student_id, status, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET status = EXCLUDED.status, completed_at = EXCLUDED.completed_at
       RETURNING *`,
      [assignmentId, req.user.id, status, completedAt],
    );
    const row = result.rows[0];
    res.json({
      id: row.id,
      assignmentId: row.assignment_id,
      studentId: row.student_id,
      status: row.status,
      completedAt: row.completed_at,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
