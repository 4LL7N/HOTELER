import * as dotenv from "dotenv"
dotenv.config()
import app from "./server"
import { expirationJob } from "./modules/bookingModules";


app.listen(process.env.PORT,()=>{
    
    console.log(`running on ${process.env.PORT}`);
    expirationJob.start()
})