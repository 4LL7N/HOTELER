import express from "express"
import morgan from "morgan"
import * as dotenv from "dotenv"
import { createUser } from "./handler/auth"

dotenv.config()

const app = express()

if(process.env.NODE_ENV == "development"){
    app.use(morgan("dev"))
}

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.post('/auth/register', createUser);


export default app
