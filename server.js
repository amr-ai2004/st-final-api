import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import axios from 'axios';
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

app.get("/qoute", async(req,res)=>{
    try{
        let response = await axios('https://api.quotable.io/random')
        const data = response.data;
        res.json({qoute: `"${data.content}" — ${data.author}`});
     }catch(error){
        console.error('Error fetching the quote:', error);
     }
})

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