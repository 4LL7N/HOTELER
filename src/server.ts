import express from "express"
import morgan from "morgan"
import * as dotenv from "dotenv"
import { createUser, login } from "./handler/auth"

dotenv.config()

const app = express()

if(process.env.NODE_ENV == "development"){
    app.use(morgan("dev"))
}

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.post('/auth/register', createUser);
app.post('/auth/login', login);


export default app
