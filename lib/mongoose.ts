import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONOGODB_URL) return console.log("MONGODB_URL not found");
  if (isConnected) return console.log("Already connected");

  try {
    await mongoose.connect(process.env.MONOGODB_URL);
    isConnected = true;
    console.log("Connected to mongodb");
  } catch (error) {
    console.log(error);
  }
};
