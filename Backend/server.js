//Loading necessary packages and db into variables for later use.
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./dbConfig');

//Create connection
const app = express();

//Middleware
app.use(cors()); //allow frontend to make requests to backend when both on different ports
app.use(express.json()); //parse JSON bodies

// JWT secret (in production, store in .env file) //COMEBACK AND CHANGE
const JWT_SECRET = 'your_jwt_secret_key';

//Create POST request that lets user sign-up with username, email, and password
app.post('/signup', async (req, res) => {
    const {username, email, password} = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM USER WHERE Email_Address = ?', [email]);

        if(rows.length > 0){
            return res.status(400).send('Email already exists');
        }
        
        //hashed password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            'INSERT INTO USER (Username, Password, Email_Address) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.json('User created successfully');
    }
    catch(err) {
        console.error('Error adding user', err);
        res.status(500).send('Error adding user to db');
    }
});

//Create POST request for user to login
app.post('/login', async (req, res) => {
    
})

//JWT Authentication Middleware
//COME BACK TO, EXPLAIN IT
const authenticateToken = 23//placeholder for no error

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});