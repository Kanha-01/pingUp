import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import {inngest, functions} from './inngest/index.js'
import {serve} from 'inngest/express'
import { clerkMiddleware } from '@clerk/express'    //will add auth property to every req when user is auhenticated

const app = express();

await connectDB();

app.use(express.json());   //all requests will be passed using json method
app.use(cors());              // bcakend to front end url connection
app.use(clerkMiddleware())     //will add auth property to every req when user is auhenticated

app.get('/', (req,res)=> res.send('server is running'))
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`))