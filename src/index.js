import dotenv from "dotenv"
dotenv.config({
    path: './env'
})
import connectDB from "./db/index.js";
import app from "./app.js";

connectDB().then(()=>{

    app.on("error",(err)=>{
        console.log("ERROR :", err)
        throw err
    })

    const PORT = process.env.PORT || 8000

    app.listen(PORT, ()=>{
        console.log(` Server is Running at PORT ${PORT}`)
    })
}).catch((err)=>{
    console.log("DB Connection failed !!", err)
})
// import express from 'express'
// const app = express()


// first approch no recommended  

// async () => {
//   try {
//     mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error)=>{
//         console.log("An error occured : ", error)
//         throw error
//     })

//     app.listen(process.env.PORT, ()=>{
//         console.log('App is listening on PORT ',process.env.PORT )
//     })
// } catch (error) {
//     console.error(error);
//   }
// };

