//Loading necessary packages and db into variables for later use.
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./dbConfig');
require('dotenv').config();

//Create connection
const app = express();

//Middleware
app.use(cors()); //allow frontend to make requests to backend when both on different ports
app.use(express.json()); //parse JSON bodies

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;

//Create POST request that lets user sign-up with username, email, and password
app.post('/signup', async (req, res) => {
    const {username, email, password} = req.body;

    try {
        //change to query
        const [rows] = await db.query('SELECT * FROM USER WHERE Email_Address = ?', [email]);
        
        //Check if any fields are empty
        if(!username || !email || !password){
            return res.status(400).json({message: 'Please fill out all fields'})
        }
        
        //Check if user exists
        if(rows.length > 0){
            return res.status(400).json({message: 'Email already exists'});
        }

        //hashed password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO USER (Username, Password, Email_Address) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );

        res.json({message: 'User created successfully'});
    }
    catch(err) {
        console.error('Error adding user', err);
        res.status(500).json({message: 'Error adding user to db'});
    }
});

//Create POST request for user to login
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try{
        const [rows] = await db.query('SELECT * FROM USER WHERE Email_Address = ?', [email])
        
        const user = rows[0];

        if(!user) return res.status(400).json({message: 'Invalid email'});

        const isMatch = await bcrypt.compare(password, user.Password);

        if(!isMatch) return res.status(400).json({message :'Incorrect password'});

        //return a token for user to remember who's logged in
        const token = jwt.sign({email: user.Email_Address, username: user.Username}, JWT_SECRET);

        res.json({ message: 'Login successful', token});
    }
    catch(err){
        console.error('Failure to login', err);
        res.status(500).json({message: 'Failure to login'});
    }
});
/*
JWT Authentication Middleware
COME BACK TO, EXPLAIN IT
Is used to verify if a token is valid using secret key
used for authentication for protected routes. A rout that 
requires the user to be loggin in or have token.
*/
const authenticateToken = 23//placeholder for no error

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});