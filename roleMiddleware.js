import bcrypt from 'bcrypt';
import pgclient from './db.js'; // Make sure this path correctly points to your pgclient setup

// Middleware to allow only "supplier"
export const MySupplier = (req, res, next) => {
  if (!req.user || req.user.role !== "supplier") {
    return res.status(403).json({ message: "Access denied: Supplier role required." });
  }
  next();
};

// Middleware to allow only "buyer"
export const MyBuyer = (req, res, next) => {
  if (!req.user || req.user.role !== "buyer") {
    return res.status(403).json({ message: "Access denied: Buyer role required." });
  }
  next();
};

// Middleware to allow either "supplier" or "buyer"
export const MyUser = (req, res, next) => {
  if (!req.user || !["supplier", "buyer"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied: Buyer or Supplier role required." });
  }
  next();
};

// Basic authentication middleware
export const basicAuth = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log(req.body);
      return res.status(400).json({ error: 'Username and password required.' });
    }

    const result = await pgclient.query(
      'SELECT * FROM app_user WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Attach the authenticated user to request for later use
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(501).json({ error: 'Internal server error.' });
  }
};
