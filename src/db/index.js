import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host} \n ${process.env.MONGODB_URI}${DB_NAME}`
    );
  } catch (error) {
    console.error("MONGODB Connection error", error);
    process.exit(1);
  }
};

export default connectDB;
