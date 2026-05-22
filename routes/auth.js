import express from 'express'
import db from '../db/dbConnection.js'

const router = express.Router();

//http://localhost:3000/api/auth/signup
router.post("/signup", async (req, res) => {
    const { email, password, name, role } = req.body;
    const exists = db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'user already exists' });

    const result = await db.query("INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, email, password, role]);
    res.status(201).json({ user: result.rows[0] });
});


//http://localhost:3000/api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1 AND password = $2",
        [email, password]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid Credentials' });
    res.status(201).json({ user: result.rows[0] })
});

export default router;

