import express from 'express';
import dotenv from 'dotenv';
import pgclient from '../db.js';
import bcrypt from 'bcrypt';
import { basicAuth, MySupplier, MyBuyer, MyUser } from '../roleMiddleware.js';

// Initialization
const authRouter = express.Router();
dotenv.config();

// Endpoints || Routes || Request URLs:

// SIGNUP endpoint
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
      `SELECT * FROM app_user WHERE email = $1 OR username = $2`,
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
      INSERT INTO app_user (username, LEI, email, phone, role, city, address1, address2, password)
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

// LOGIN endpoint
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pgclient.query(
      'SELECT * FROM app_user WHERE username = $1',
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

// GET profile
authRouter.post('/profile', basicAuth, async (req, res) => {
  try {
    const user = req.user;

    // Return user data excluding password
    const { password, ...userData } = user;
    return res.json(userData);
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// UPDATE profile
authRouter.put('/profile', basicAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      email,
      phone,
      city,
      address1,
      address2,
      password // optional
    } = req.body;

    let hashedPassword = user.password;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const result = await pgclient.query(
      `UPDATE app_user SET
        email = $1,
        phone = $2,
        city = $3,
        address1 = $4,
        address2 = $5,
        password = $6
      WHERE username = $7
      RETURNING id, username, email, phone, city, address1, address2, role`,
      [email, phone, city, address1, address2, hashedPassword, user.username]
    );

    return res.json({
      message: 'Profile updated successfully.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default authRouter;
