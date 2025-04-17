import express from "express"
import morgan from "morgan"
import * as dotenv from "dotenv"
dotenv.config()

import booksRouter from "./routes/booksRouter"
import jwt from "jsonwebtoken"
import { user } from "@prisma/client"


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

app.use("/api/bookings",booksRouter)

export default app
