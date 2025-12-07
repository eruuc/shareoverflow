import mongoose from "mongoose";

export async function connectToDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error("Missing env var MONGODB_URI");
  
  try {
    // Use dbName option instead of modifying the URI
    // This is the proper way to specify the database name
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'DanielPanWebDev'
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

