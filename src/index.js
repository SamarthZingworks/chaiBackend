import dotenv from "dotenv"
dotenv.config({
    path: './env'
})
import connectDB from "./db/index.js";

connectDB()
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

