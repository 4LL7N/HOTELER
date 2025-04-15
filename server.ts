import express from "express"
import morgan from "morgan"
import * as dotenv from "dotenv"
dotenv.config()

import adminRouter from "./src/routes/adminRouter"
import authRouter from "./src/routes/authRouter"
import bookingsRouter from "./src/routes/bookingsRouter"
import roomsRouter from "./src/routes/roomsRouter"
import servicesRouter from "./src/routes/servicesRouter"
import usersRouter from "./src/routes/usersRouter"

const app = express()

if(process.env.NODE_ENV == "development"){
    app.use(morgan("dev"))
}

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use("/api/admin",adminRouter)
app.use("/api/auht",authRouter)
app.use("/api/booking",bookingsRouter)
app.use("/api/rooms",roomsRouter)
app.use("/api/services",servicesRouter)
app.use("/api/users",usersRouter)

export default app
