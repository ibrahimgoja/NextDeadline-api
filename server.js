import express from 'express'
import dotenv from 'dotenv'
import db from './db/dbConnection.js'

dotenv.config();

const PORT = process.env.PORT;

const app = express();

db.connect()
.then(() => {
    app.listen(PORT, () => [
        console.log('app listening on port 3000')
        
    ])
})


