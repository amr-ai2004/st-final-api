# SupplyHub API

This is the backend API for the SupplyHub platform, a B2B platform designed to connect product manufacturers (buyers) with raw material suppliers.

The server is built using **Node.js** with **Express**, and it connects to a **PostgreSQL** database using `pg`.

---

## Project Structure

```
.
├── db.js                  # PostgreSQL connection
├── server.js              # Main server entry point
├── roleMiddleware.js      # Middleware for role-based access control and basic authentication
├── routes/
│   ├── auth.js            # Routes for authentication (sign up, login, profile)
│   └── offer.js           # Routes for offers and bidding
```

---

## Endpoints

### 🔐 Authentication Routes (auth.js)

#### POST `/api/auth/signup`
Registers a new user.

**Request Body:**
```json
{
  "username": "safabuyer",
  "LEI": "123456789",
  "email": "safabuyer@example.com",
  "phone": "+1234567890",
  "role": "buyer",  // or "supplier"
  "city": "Amman",
  "address1": "Street A",
  "address2": "Block B",
  "password": "securepassword123"
}
```

#### POST `/api/auth/login`
Authenticates a user.

**Request Body:**
```json
{
  "username": "safabuyer",
  "password": "securepassword123"
}
```

#### GET `/api/auth/profile`
Fetch user profile.

**Request Body:**
```json
{
  "username": "safabuyer",
  "password": "securepassword123"
}
```

#### PUT `/api/auth/profile`
Update user profile.

**Request Body:**
```json
{
  "username": "safabuyer",
  "password": "securepassword123",
  "email": "updated@example.com",
  "phone": "0788888888",
  "city": "Irbid",
  "address1": "New Address",
  "address2": "New Block"
}
```

---

### 📦 Offer Routes (offer.js)

#### GET `/api/offers`
Get all offers (available to all users).

**Request Body:**
```json
{
  "username": "safabuyer",
  "password": "securepassword123"
}
```

#### GET `/api/offers/myoffers`
Get all offers created by the authenticated supplier.

**Request Body:**
```json
{
  "username": "safasupplier",
  "password": "securepassword123"
}
```

#### GET `/api/offers/offerdetails/:id`
Get details of a specific offer.

**Request Body:**
```json
{
  "username": "safabuyer",
  "password": "securepassword123"
}
```

---

#### POST `/api/offers/offerbid`
Submit a bid to an offer (Buyer only).

**Request Body:**
```json
{
  "username": "safabuyer",
  "password": "securepassword123",
  "bidPrice": 150.5,
  "offerId": 1
}
```

#### GET `/api/offers/offerbid/:id`
View all bids for a specific offer (Supplier only).

**Request Body:**
```json
{
  "username": "safasupplier",
  "password": "securepassword123"
}
```

---

#### POST `/api/offers/offercreate`
Create a new offer (Supplier only).

**Request Body:**
```json
{
  "username": "safasupplier",
  "password": "securepassword123",
  "product": "Aluminum Sheets",
  "quantity": 500,
  "start_date": "2025-06-01",
  "batches": 5,
  "end_date": "2025-07-01",
  "price": 300.0
}
```

---

## Roles

- `supplier`: Can create offers, view own offers, and view bids.
- `buyer`: Can view offers and place bids.
- Both roles can authenticate and manage their profile.

---

## Notes

- Basic Authentication is handled by passing `username` and `password` in the request body.
- The API responds with JSON and uses role-based middleware to secure endpoints.
- No token-based authentication (e.g., JWT) is used.

---

## Author

This API was created as part of the SupplyHub project, inspired by best practices from the HTU MERN course GitHub repository.