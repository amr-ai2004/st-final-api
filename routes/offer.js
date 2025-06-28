import express from 'express';
import dotenv from 'dotenv';
import pgclient from '../db.js';
import bcrypt from 'bcrypt';
import { basicAuth, MySupplier, MyBuyer, MyUser } from '../roleMiddleware.js';


//Initialization
const offerRouter= express.Router();
dotenv.config();

//Endpoints || Routes || Request URLs:
// GET /api/offers
// Returns all available offers (visible to both buyers and suppliers)
offerRouter.post('/', basicAuth, async (req, res) => {
  try {
    const result = await pgclient.query(`
      SELECT offer.id, offer.product, offer.quantity, offer.start_date, offer.end_date, 
             offer.batches, offer.price, app_user.username AS offerer_name
      FROM offer
      JOIN app_user ON offer.offerer = app_user.id
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching offers:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/offers/myoffers
// Returns only the offers placed by the logged-in supplier
offerRouter.post('/myoffers', basicAuth, MySupplier, async (req, res) => {
  try {
    const supplierId = req.user.id;

    const result = await pgclient.query(`
      SELECT id, product, quantity, start_date, end_date, batches, price
      FROM offer
      WHERE offerer = $1
    `, [supplierId]);

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my offers:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/offers/offerdetails/:id
// Returns detailed info about a single offer (accessible by supplier or buyer)
offerRouter.post('/offerdetails/:id', basicAuth, MyUser, async (req, res) => {
  try {
    const offerId = req.params.id;

    const result = await pgclient.query(`
      SELECT o.id, o.product, o.quantity, o.start_date, o.end_date, o.batches, o.price,
             a.username AS offerer_name, a.role AS offerer_role
      FROM offer o
      JOIN app_user a ON o.offerer = a.id
      WHERE o.id = $1
    `, [offerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching offer details:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/offers/offerbid
// Buyers can place a bid on an existing offer
offerRouter.post('/offerbid', basicAuth, MyBuyer, async (req, res) => {
  try {
    const { offerId, bidPrice } = req.body;

    if (!offerId || !bidPrice) {
      return res.status(400).json({ error: 'Offer ID and bid price are required.' });
    }

    // Check if offer exists
    const offerCheck = await pgclient.query('SELECT * FROM offer WHERE id = $1', [offerId]);
    if (offerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    // Insert bid
    const result = await pgclient.query(
      `INSERT INTO bid (bidder, offer, price)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, offerId, bidPrice]
    );

    return res.status(201).json({
      message: 'Bid placed successfully.',
      bid: result.rows[0],
    });
  } catch (err) {
    console.error('Error placing bid:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/offers/offerbid/:offerId
// View all bids for a specific offer
offerRouter.post('/offerbid/:offerId', basicAuth, MyUser, async (req, res) => {
  try {
    const offerId = parseInt(req.params.offerId);

    if (isNaN(offerId)) {
      return res.status(400).json({ error: 'Invalid offer ID.' });
    }

    const result = await pgclient.query(
      `SELECT b.id, b.price, b.bidder, u.username AS bidder_name
       FROM bid b
       JOIN app_user u ON b.bidder = u.id
       WHERE b.offer = $1`,
      [offerId]
    );

    return res.json({
      offerId,
      totalBids: result.rows.length,
      bids: result.rows,
    });
  } catch (err) {
    console.error('Error retrieving bids:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/offers/offercreate
// Suppliers can create a new offer
offerRouter.post('/offercreate', basicAuth, MySupplier, async (req, res) => {
  try {
    const {
      product,
      quantity,
      start_date,
      end_date,
      price,
      batches
    } = req.body;

    if (!product || !quantity || !start_date || !end_date || !price || !batches) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const result = await pgclient.query(
      `INSERT INTO offer 
        (product, quantity, start_date, end_date, price, batches, offerer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product, quantity, start_date, end_date, price, batches, req.user.id]
    );

    return res.status(201).json({
      message: 'Offer created successfully.',
      offer: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating offer:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/offers/:id
// DELETE /api/offers/:id
offerRouter.delete('/:id', basicAuth, MySupplier, async (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const { username } = req.body;

    if (isNaN(offerId)) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }

    // Get user ID from username
    const userResult = await pgclient.query(
      'SELECT id FROM app_user WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Delete the offer only if the user is the offerer
    const result = await pgclient.query(
      'DELETE FROM offer WHERE id = $1 AND offerer = $2',
      [offerId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized or offer not found' });
    }

    res.status(200).json({ message: 'Offer deleted successfully' });
  } catch (err) {
    console.error("Delete Offer Error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



export default offerRouter;