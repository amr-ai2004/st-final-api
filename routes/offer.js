import express from 'express';
import dotenv from 'dotenv';
import pgclient from '../db.js';
import { basicAuth, MySupplier, MyBuyer, MyUser } from '../roleMiddleware.js';


//Initialization
const offerRouter= express.Router();
dotenv.config();

//Endpoints || Routes || Request URLs:



export default offerRouter;