import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const { courseId, semesterId } = req.body;

    const semester = await db.query(
      'SELECT id FROM semesters WHERE id = $1 AND user_id = $2',
      [semesterId, req.user.id],
    );
    if (semester.rows.length === 0) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    const course = await db.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const result = await db.query(
      'INSERT INTO enrollments (student_id, course_id, semester_id) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, courseId, semesterId],
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      semesterId: row.semester_id,
      enrolledAt: row.enrolled_at,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Already enrolled in this course for this semester' });
    }
    next(err);
  }
});

router.delete('/course/:courseId/semester/:semesterId', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM enrollments WHERE course_id = $1 AND semester_id = $2 AND student_id = $3 RETURNING id',
      [req.params.courseId, req.params.semesterId, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
