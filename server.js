import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
//Local imports:
import authRouter from './routes/auth.js';
import offerRouter from './routes/offer.js';
import pgclient from './db.js';
import { basicAuth, MySupplier, MyBuyer, MyUser } from './roleMiddleware.js';

//Initialization
const app = express();
dotenv.config();

const PORT = process.env.PORT || 3002;

//Middleware:
app.use(cors());
app.use(express.json());

//Endpoints || Routes || Request URLs:
app.use('/api/auth', authRouter); //Login, Sign in, Logout, Profile.
app.use('/api/offers', offerRouter); //User, Offers, MyOffers, OfferDetails, OfferCreate.


app.use((req,res)=>{
    res.json({"message":"Page/Route not found"});
});

pgclient.connect()
    .then(()=>{
        app.listen(PORT, ()=>{
            console.log(`Listening on port ${PORT}`);
        });
    }).catch((error)=>{
        console.log("Error connection to pg server.");
        console.log(error);
    });