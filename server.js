import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import db from './db/dbConnection.js'
import authRoutes from './routes/auth.js'

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use("/api/auth", authRoutes);

db.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`app listening on port ${PORT}`)
        })
    })


