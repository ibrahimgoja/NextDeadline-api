import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import db from './db/dbConnection.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import semesterRoutes from './routes/semesters.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import assignmentRoutes from './routes/assignments.js';
import progressRoutes from './routes/progress.js';
import taskRoutes from './routes/tasks.js';
import materialRoutes from './routes/materials.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/materials', materialRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

db.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`app listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
