/** 
Import the mysql2 library for database interaction
'/promise' this makes it so any db requests return a promise.
*/
const mysql =  require('mysql2');

//Load environment variables from .env file
require('dotenv').config();

//consider connection pool to allow multiple database connections
//Returns promise that there will be a connection returned.

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
}).promise();

module.exports = pool;