import express from "express"
import morgan from "morgan"
import * as dotenv from "dotenv"
import { createUser, login } from "./handler/auth"

dotenv.config()
import jwt from "jsonwebtoken"
import { user } from "@prisma/client"

import booksRouter from "./routes/booksRouter"
import paymentRouter from "./routes/paymentRouter"

declare global {
    namespace Express {
      interface Request {
        user?: user | jwt.JwtPayload; // Make it optional
      }
    }
  }


const app = express()

if(process.env.NODE_ENV == "development"){
    app.use(morgan("dev"))
}

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.post('/auth/register', createUser);
app.post('/auth/login', login);


app.use("/api/bookings",booksRouter)
app.use("/api/payment",paymentRouter)


export default app
