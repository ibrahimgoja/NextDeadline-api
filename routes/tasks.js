import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = express.Router();

router.post('/', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { title, description, assignmentId, courseId } = req.body;

    let resolvedCourseId = courseId;
    if (assignmentId) {
      const assignment = await db.query(
        `SELECT a.course_id FROM assignments a
         JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = $1
         WHERE a.id = $2`,
        [req.user.id, assignmentId],
      );
      if (assignment.rows.length === 0) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      resolvedCourseId = assignment.rows[0].course_id;
    }

    const result = await db.query(
      'INSERT INTO tasks (student_id, course_id, title, description, assignment_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, resolvedCourseId, title, description || null, assignmentId || null],
    );
    const task = result.rows[0];
    res.status(201).json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description || '',
        assignmentId: task.assignment_id,
        courseId: task.course_id,
        studentId: task.student_id,
        completed: task.completed,
        createdAt: task.created_at,
      },
      progress: {
        id: `${task.id}-progress`,
        taskId: task.id,
        studentId: task.student_id,
        completed: task.completed,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/toggle', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const result = await db.query(
      'UPDATE tasks SET completed = NOT completed WHERE id = $1 AND student_id = $2 RETURNING *',
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const task = result.rows[0];
    res.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description || '',
        assignmentId: task.assignment_id,
        courseId: task.course_id,
        studentId: task.student_id,
        completed: task.completed,
        createdAt: task.created_at,
      },
      progress: {
        id: `${task.id}-progress`,
        taskId: task.id,
        studentId: task.student_id,
        completed: task.completed,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
