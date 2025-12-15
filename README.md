Pokémon Card Collection Database Application
Setup Instructions and Documentation

Table of Contents

Development Environment Details
Prerequisites
Installation Instructions
Database Configuration
Running the Application
Transaction Implementation Documentation


1. Development Environment Details
Backend:

Programming Language: JavaScript (Node.js)
Framework: Express.js
Database System: MySQL

Frontend:

Framework: React
UI Library: React Router DOM, React Icons

Key Technologies:

Authentication: JWT (JSON Web Tokens) with bcrypt for password hashing
External API: TCGdex SDK for Pokémon card data and images
CORS enabled for frontend-backend communication


2. Prerequisites
Before installing the application, ensure you have the following installed:

Node.js (v14 or higher recommended)
npm (Node Package Manager)
MySQL Server (v8.0 or higher recommended)
A MySQL client or tool for database setup


3. Installation Instructions
Backend Setup

Navigate to the Backend directory:

   cd Backend

Install required dependencies:

npm install [package]

The following packages will be installed:

express: Web application framework
cors: Enable Cross-Origin Resource Sharing
bcrypt: Password hashing
jsonwebtoken: JWT authentication
dotenv: Environment variable management
mysql2: MySQL database driver
@tcgdex/sdk: Pokémon TCG API integration
nodemon: Development server with auto-restart

Frontend Setup

Navigate to the Frontend directory:

   cd Frontend

Install required dependencies:

   npm install
The following packages will be installed:

react: React library
react-dom: React DOM rendering
react-router-dom: Client-side routing
react-icons: Icon library
jwt-decode: JWT token decoding
@tcgdex/sdk: Pokémon TCG API integration


4. Database Configuration
Step 1: Create the Database
Run your SQL schema file to create the database and tables. Ensure the following tables are created:

USER
CARD
EXPANSION
COLLECTION
VARIANT (if applicable)

Step 2: Configure Backend Database Connection

In the Backend directory, create a .env file with the following variables:

   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   JWT_SECRET=your_secret_key_here
   PORT=5000

Ensure dbConfig.js is properly configured to use these environment variables for MySQL connection pooling.

Step 3: Verify Database Connection
Test the database connection by starting the backend server (see Running the Application section).

5. Running the Application
Start the Backend Server

Navigate to the Backend directory:

   cd Backend

Start the server:

   npm start
The backend server will run on http://localhost:5000 (or the port specified in your .env file)
Start the Frontend Application

Navigate to the Frontend directory:

   cd Frontend

Start the React development server:

   npm start
The frontend application will typically run on http://localhost:3000 and should automatically open in your browser.
Accessing the Application
Once both servers are running, access the application at http://localhost:3000 in your web browser.

6. Transaction Implementation Documentation
This application implements several database transactions to ensure data consistency and integrity, particularly for critical operations involving user collections.
Transaction 1: User Registration (/signup)
Purpose: Safely create a new user account with proper validation and error handling.
Implementation:

Begins a database transaction using connection.beginTransaction()
Validates input fields (username, email, password)
Checks if email already exists in the database
Hashes the password using bcrypt for security
Inserts the new user into the USER table
Commits transaction if successful, or rolls back on error

Why Transaction: Ensures atomic user creation. If any step fails (e.g., database insert), the transaction rolls back to prevent partial user records.
Transaction 2: User Login (/login)
Purpose: Authenticate users and generate JWT tokens securely.
Implementation:

Begins a transaction
Queries the USER table to find the user by email
Compares the provided password with the stored hashed password using bcrypt
Generates a JWT token containing user information (email, username, user ID)
Commits transaction on successful authentication

Why Transaction: Ensures that authentication queries are isolated and any database errors during login can be properly handled with rollback.
Transaction 3: Add Card to Collection (/addCard)
Purpose: Add a card to a user's collection or increment quantity if already exists.
Implementation:

Requires authentication via JWT token (authenticateToken middleware)
Begins a transaction
Uses INSERT ... ON DUPLICATE KEY UPDATE to either:

Insert a new card into the COLLECTION table, or
Increment the Quantity by 1 if the card already exists for that user


Commits transaction if successful
Rolls back on any error

Why Transaction: Critical for maintaining accurate inventory counts. The transaction ensures that duplicate inserts don't occur and quantity updates are atomic. If the operation fails midway, the rollback prevents inconsistent collection data.
Transaction 4: Remove Card from Collection (/removeCard)
Purpose: Decrement card quantity or remove card entirely if quantity reaches zero.
Implementation:

Requires authentication via JWT token
Begins a transaction
First attempts to decrement quantity by 1 (UPDATE query) if quantity > 1
If UPDATE affects 0 rows (meaning quantity was 1 or card doesn't exist), executes DELETE query
Checks if DELETE affected any rows to verify the card existed
Commits on success, rolls back if card wasn't found
Returns appropriate status messages

Why Transaction: This is a complex two-step operation that must be atomic. The transaction ensures that:

The quantity decrement and potential deletion happen as one unit
No race conditions occur if multiple delete requests happen simultaneously
The collection remains consistent - a card is either decremented or fully removed, never left in an invalid state

Additional Transaction Features:

Connection pooling: Uses db.getConnection() to get dedicated connections for transactions
Error handling: All transactions include try-catch-finally blocks
Connection cleanup: Connections are always released in the finally block
Rollback on failure: Any database error triggers an automatic rollback
Proper HTTP status codes: Returns appropriate status codes (200, 400, 404, 500) based on operation results