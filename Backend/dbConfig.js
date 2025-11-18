//Import the mysql2 library for database interaction
import mysql from 'mysql2';

//Load environment variables from .env file
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})

db.connect((err) => {
    if(err) {
        console.log('Database connection failed', err)
    }

    else{
        console.log('Connected to the database');
    }
});

export default db