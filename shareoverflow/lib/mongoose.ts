import mongoose from "mongoose";

export async function connectToDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error("Missing env var MONGODB_URI");
  
  // Parse the URI and add database name if not present
  let uri = process.env.MONGODB_URI;
  
  // If the URI doesn't have a database name, add it
  if (!uri.match(/\/[^\/\?]+(\?|$)/)) {
    // No database in path, add it before the query string
    if (uri.includes('?')) {
      uri = uri.replace('?', '/DanielPanWebDev?');
    } else {
      uri = uri + '/DanielPanWebDev';
    }
  }
  
  await mongoose.connect(uri);
}

