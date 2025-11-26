//Import the mysql2 library for database interaction
const mysql =  require('mysql2');

//Load environment variables from .env file
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    
})

connection.connect((err) => {
    if(err) {
        console.log('Database connection failed', err)
        return;
    }

    else{
        console.log('Connected to the database');
    }
});

module.exports = connection;