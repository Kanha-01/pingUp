import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import {inngest, functions} from './inngest/index.js'

const app = express();

await connectDB();

app.use(express.json());   //all requests will be passed using json method
app.use(cors());

app.get('/', (req,res)=> res.send('server is running'))
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`))