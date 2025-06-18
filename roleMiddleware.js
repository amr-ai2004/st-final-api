// middleware to allow only "supplier"
const MySupplier = (req, res, next) => {
  if (!req.user || req.user.role !== "supplier") {
    return res.status(403).json({ message: "Access denied: Supplier role required." });
  }
  next();
};

// middleware to allow only "buyer"
const MyBuyer = (req, res, next) => {
  if (!req.user || req.user.role !== "buyer") {
    return res.status(403).json({ message: "Access denied: Buyer role required." });
  }
  next();
};

// middleware to allow either "supplier" or "buyer"
const MyUser = (req, res, next) => {
  if (!req.user || !["supplier", "buyer"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied: Buyer or Supplier role required." });
  }
  next();
};

export const basicAuth = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required.' });
    }

    const result = await pgclient.query(
      'SELECT * FROM users WHERE username = $1',
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
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export default {
  MySupplier,
  MyBuyer,
  MyUser,
  basicAuth
};