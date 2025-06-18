import express from 'express';
import dotenv from 'dotenv';
import pgclient from '../db.js';
import { basicAuth, MySupplier, MyBuyer, MyUser } from '../roleMiddleware.js';


//Initialization
const authRouter= express.Router();
dotenv.config();

//Endpoints || Routes || Request URLs:
authRouter.post('/signup', async (req, res) => {
  try {
    const {
      username,
      LEI,
      email,
      phone,
      role, // should be 'supplier' or 'buyer'
      city,
      address1,
      address2,
      password,
    } = req.body;

    // Check for duplicate username or email
    const existingUser = await pgclient.query(
      `SELECT * FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User with this email or username already exists.',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertQuery = `
      INSERT INTO users (username, LEI, email, phone, role, city, address1, address2, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, email, role;
    `;

    const result = await pgclient.query(insertQuery, [
      username,
      LEI,
      email,
      phone,
      role,
      city,
      address1,
      address2,
      hashedPassword,
    ]);

    return res.status(201).json({
      message: 'User registered successfully.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({
      error: 'Internal server error.',
      details: err.message,
    });
  }
});


// @route   POST /api/auth/login
// @desc    Log in a user using username and password
// @access  Public
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pgclient.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Respond with user details (excluding password)
    const { password: _, ...safeUser } = user;
    return res.status(200).json({
      message: 'Login successful.',
      user: safeUser,
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      error: 'Internal server error.',
      details: err.message,
    });
  }
});


export default authRouter;