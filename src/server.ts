import express from "express"
import morgan from "morgan"
import * as dotenv from "dotenv"
dotenv.config()

const app = express()

if(process.env.NODE_ENV == "development"){
    app.use(morgan("dev"))
}

app.use(express.json())
app.use(express.urlencoded({extended:true}))


export default app
