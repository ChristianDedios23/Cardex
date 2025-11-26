/** 
Import the mysql2 library for database interaction
'/promise' this makes it so any db requests return a promise.
*/
const mysql =  require('mysql2/promise');

//Load environment variables from .env file
require('dotenv').config();

//consider connection pool to allow multiple database connections
//Returns promise that there will be a connection returned.
async function connectDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });

        console.log('Connected to the database');
        return connection;
    } 
    catch (err) {
        console.error('Database connection failed', err);
        process.exit(1); // stop app if DB fails
    }
}

module.exports = connectDB();