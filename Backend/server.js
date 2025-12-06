//Loading necessary packages and db into variables for later use.
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./dbConfig');
require('dotenv').config();


//Create connection
const app = express();

const TCGdex = require('@tcgdex/sdk').default;
const tcgdex = new TCGdex('en');

//Middleware
app.use(cors()); //allow frontend to make requests to backend when both on different ports
app.use(express.json()); //parse JSON bodies

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;


/*
JWT Authentication Middleware
COME BACK TO, EXPLAIN IT
Is used to verify if a token is valid using secret key
used for authentication for protected routes. A rout that 
requires the user to be loggin in or have token.
*/
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = user;
        next();
    });
};

//Create POST request that lets user sign-up with username, email, and password
app.post('/signup', async (req, res) => {
    
    const email = req.body.email?.trim();
    const username = req.body.username?.trim();
    const password = req.body.password?.trim();
    const connection = await db.getConnection();
    
    try {
        
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM USER WHERE Email_Address = ?', [email]);

        console.log(rows);

        //Check if any fields are empty
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please fill out all fields' })
        }

        //Check if user exists
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        //hashed password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [results] = await connection.query(
            'INSERT INTO USER (Username, Password, Email_Address) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );
        
        await connection.commit();

        res.json({ message: 'User created successfully' });
    }
    catch (err) {
        await connection.rollback();
        console.error('Error adding user', err);
        res.status(500).json({ message: 'Error adding user to db' });
    }
    finally{
        connection.release();
    }
});

//Create POST request for user to login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM USER WHERE Email_Address = ?', [email])

        const user = rows[0];

        if (!user) return res.status(400).json({ message: 'Invalid email' });

        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

        await connection.commit();

        //return a token for user to remember who's logged in
        const token = jwt.sign({ email: user.Email_Address, username: user.Username, id: user.User_ID }, JWT_SECRET);

        res.json({ message: 'Login successful', token });
    }
    catch (err) {
        await connection.rollback();
        console.error('Failure to login', err);
        res.status(500).json({ message: 'Failure to login' });
    }
    finally{
        connection.release();
    }
});

// Create get request for card searches
app.get('/getCard', async (req, res) => {
    const card = req.query.cardName;
    const likeTerm = `${card}%`
    try {
        const [cards] = await db.query('SELECT * FROM CARD WHERE Card_Name LIKE ?', [likeTerm]);
        res.status(200).json(cards);
        

    } catch (err) {
        console.error("Couldnt get card.", err);
        res.status(500).json({ message: 'Server Error' });

    }

});

// create get request for set searches
app.get('/getSet', async (req, res) => {
    const setName = req.query.setName;
    const likeTerm = `${setName}%`;

    try {
        const [cards] = await db.query('SELECT c.* FROM CARD c JOIN EXPANSION e ON e.Set_Code = c.Set_Code WHERE e.Set_Name LIKE ?', [likeTerm]);
        res.status(200).json(cards);
        
    } catch (err) {
        console.error("Couldnt find set", err);
        res.status(500).json({ message: ' Couldnt find set Server Error' });
    }

});

// create get request for in collection card searches
app.get('/getCardInCollection', authenticateToken, async (req, res) => {
    const cardName = req.query.cardName;
    const userID = req.user.id;
    const likeTerm = `${cardName}%`;
    try {
        const [cards] = await db.query('SELECT ca.* FROM CARD ca JOIN COLLECTION co ON co.Card_ID = ca.Card_ID WHERE ca.Card_Name LIKE ? AND co.User_ID = ?', [likeTerm, userID]);
        res.status(200).json(cards);
    } catch (err) {
        console.error("Server error", err);
        res.status(500).json({message:"Couldnt get card"})
    }

});


// create a post request to add a card to the users collection.
app.post('/addCard', authenticateToken, async (req, res) => {
    const cardId = req.body.cardId;
    const userId = req.user.id;
    const variantId = req.body.variantId;
    const quantity = req.body.quantity;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('INSERT INTO COLLECTION (User_ID, Card_ID, Variant_ID, Quantity) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE Quantity = Quantity + 1', [userId, cardId, variantId, quantity]);

        await connection.commit();

        res.status(200).json({ message: 'Added successfully!' });


    } catch (err) {
        await connection.rollback();
        console.error("Transaction failed: ",err);
        res.status(500).json({error:"Transaction failed"});
    } finally {
        connection.release();
    }
    
});

// create get request for quantity
app.get('/getQuantity', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const cardId = req.query.cardId;
    try {
        const quantity = await db.query('SELECT Quantity FROM COLLECTION WHERE User_ID = ? AND Card_ID = ?', [userId, cardId]);
        res.status(200).json(quantity[0]);
    } catch (err) {
        res.status(500).json({message:"Couldnt find quantity"})
        console.error(err);
    }
});

// create a delete request to remove a card from the users collection.
app.delete('/removeCard', authenticateToken, async (req, res) => {
    const cardId = req.query.cardId;
    const userId = req.user.id;
    const variantId = req.query.variantId;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query('UPDATE COLLECTION SET Quantity = Quantity - 1 WHERE User_ID = ? AND Card_ID = ? AND Variant_ID = ? AND Quantity > 1', [userId, cardId, variantId]);
        if (result.affectedRows === 0) {
            console.log('deleted');
            const [deleted] = await connection.query('DELETE FROM COLLECTION WHERE User_ID = ? AND Card_ID = ? AND Variant_ID = ?', [userId, cardId, variantId]);
            if (deleted.affectedRows === 0) {
                console.log('rollback is activated');
                await connection.rollback();
                return res.status(404).json({ message: 'Card not found in collection' });
            }
        }
        await connection.commit();
        res.status(200).json({ message: 'Removed successfully!' });
    } catch (err) {
        await connection.rollback();
        console.error("Removing card failed: ", err);
        res.status(500).json({ error: "Removing card failed" });
    } finally {
        connection.release();
    }
});


//Create GET request that retrieves the image for each card
//Account for trainers and items
app.get('/image', async (req, res) => {
    try {
        const pokemonID = req.query.pokemonID;
        const setID = req.query.setID;
        const formatted = String(pokemonID).padStart(3, '0');
        const card = await tcgdex.card.get(setID + '-' + formatted);

        const lowImg = card.getImageURL('low', 'png');

        res.json({
            id: card.id,
            name: card.name,
            rarity: card.rarity,
            imageLow: lowImg
        });
    }
    catch (err) {
        console.error('error fetching card image', err);
    }
});

// create get request for cards in my collection
app.get('/myCards', authenticateToken, async (req,res) => {

    const userId = req.user.id;

    try {
        const [result] = await db.query('SELECT ca.* FROM CARD ca JOIN COLLECTION co ON ca.Card_ID = co.Card_ID JOIN USER u ON u.User_ID = co.User_ID WHERE co.User_ID = ?', [userId]);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({message: "No cards found"});
        console.error(err);
    }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});