import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function toMaterial(row) {
  let description = row.description || '';
  let fileName = null;
  if (description.includes('|file:')) {
    const [desc, file] = description.split('|file:');
    description = desc;
    fileName = file || null;
  }
  return {
    id: row.id,
    title: row.title,
    description,
    courseId: row.course_id,
    fileName,
    createdAt: row.created_at,
  };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'student') {
      const [semesters, courses, enrollments, assignments, progress, tasks, materials] = await Promise.all([
        db.query('SELECT * FROM semesters WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        db.query('SELECT * FROM courses ORDER BY created_at DESC'),
        db.query('SELECT * FROM enrollments WHERE student_id = $1', [userId]),
        db.query(
          `SELECT DISTINCT a.* FROM assignments a
           JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = $1
           ORDER BY a.created_at DESC`,
          [userId],
        ),
        db.query('SELECT * FROM assignment_progress WHERE student_id = $1', [userId]),
        db.query('SELECT * FROM tasks WHERE student_id = $1 ORDER BY created_at DESC', [userId]),
        db.query(
          `SELECT m.* FROM materials m
           JOIN enrollments e ON e.course_id = m.course_id AND e.student_id = $1
           ORDER BY m.created_at DESC`,
          [userId],
        ),
      ]);

      const taskRows = tasks.rows;
      return res.json({
        semesters: semesters.rows.map((row) => ({
          id: row.id,
          name: row.name,
          year: row.year,
          season: row.season,
          userId: row.user_id,
          createdAt: row.created_at,
        })),
        courses: courses.rows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          description: row.description,
          instructorId: row.instructor_id,
          color: row.color,
          createdAt: row.created_at,
        })),
        enrollments: enrollments.rows.map((row) => ({
          id: row.id,
          studentId: row.student_id,
          courseId: row.course_id,
          semesterId: row.semester_id,
          enrolledAt: row.enrolled_at,
        })),
        assignments: assignments.rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          courseId: row.course_id,
          dueDate: row.due_date,
          points: row.points,
          createdAt: row.created_at,
        })),
        assignmentProgress: progress.rows.map((row) => ({
          id: row.id,
          assignmentId: row.assignment_id,
          studentId: row.student_id,
          status: row.status,
          completedAt: row.completed_at,
        })),
        tasks: taskRows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          assignmentId: row.assignment_id,
          courseId: row.course_id,
          studentId: row.student_id,
          completed: row.completed,
          createdAt: row.created_at,
        })),
        taskProgress: taskRows.map((row) => ({
          id: `${row.id}-progress`,
          taskId: row.id,
          studentId: row.student_id,
          completed: row.completed,
        })),
        slides: materials.rows.map(toMaterial),
      });
    }

    const [courses, enrollments, assignments, materials] = await Promise.all([
      db.query('SELECT * FROM courses WHERE instructor_id = $1 ORDER BY created_at DESC', [userId]),
      db.query(
        `SELECT e.* FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = $1`,
        [userId],
      ),
      db.query(
        `SELECT a.* FROM assignments a
         JOIN courses c ON c.id = a.course_id
         WHERE c.instructor_id = $1
         ORDER BY a.created_at DESC`,
        [userId],
      ),
      db.query(
        `SELECT m.* FROM materials m
         JOIN courses c ON c.id = m.course_id
         WHERE c.instructor_id = $1
         ORDER BY m.created_at DESC`,
        [userId],
      ),
    ]);

    res.json({
      semesters: [],
      courses: courses.rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        instructorId: row.instructor_id,
        color: row.color,
        createdAt: row.created_at,
      })),
      enrollments: enrollments.rows.map((row) => ({
        id: row.id,
        studentId: row.student_id,
        courseId: row.course_id,
        semesterId: row.semester_id,
        enrolledAt: row.enrolled_at,
      })),
      assignments: assignments.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        courseId: row.course_id,
        dueDate: row.due_date,
        points: row.points,
        createdAt: row.created_at,
      })),
      assignmentProgress: [],
      tasks: [],
      taskProgress: [],
      slides: materials.rows.map(toMaterial),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
