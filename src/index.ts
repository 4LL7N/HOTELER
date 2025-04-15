import app from "../server"


app.listen(process.env.PORT,()=>{
    console.log(`running on ${process.env.PORT}`);
})