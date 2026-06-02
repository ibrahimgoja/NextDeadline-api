import express from 'express';
import db from '../db/dbConnection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = express.Router();

router.post('/', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const { title, description, courseId, fileName } = req.body;
    const owned = await db.query(
      'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
      [courseId, req.user.id],
    );
    if (owned.rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const desc = fileName ? `${description || ''}|file:${fileName}` : (description || null);
    const result = await db.query(
      'INSERT INTO materials (course_id, title, type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [courseId, title, 'slides', desc],
    );
    const row = result.rows[0];
    let materialDescription = row.description || '';
    let materialFileName = null;
    if (materialDescription.includes('|file:')) {
      const [descPart, filePart] = materialDescription.split('|file:');
      materialDescription = descPart;
      materialFileName = filePart || null;
    }
    res.status(201).json({
      id: row.id,
      title: row.title,
      description: materialDescription,
      courseId: row.course_id,
      fileName: materialFileName,
      createdAt: row.created_at,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('instructor'), async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM materials m
       USING courses c
       WHERE m.course_id = c.id AND m.id = $1 AND c.instructor_id = $2
       RETURNING m.id`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
