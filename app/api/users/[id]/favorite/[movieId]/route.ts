import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { MovieModel } from "@/models/Movie";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; movieId: string }> }) {
  try {
    await connectToDB();
    const { id: userId, movieId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(movieId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    // Convert string IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const movieObjectId = new mongoose.Types.ObjectId(movieId);
    
    // Add to user's favorites
    await UserModel.updateOne(
      { _id: userObjectId },
      { $addToSet: { favorites: movieObjectId } }
    );
    
    // Add to movie's favoritedBy
    await MovieModel.updateOne(
      { _id: movieObjectId },
      { $addToSet: { favoritedBy: userObjectId } }
    );
    
    return Response.json({ success: true, message: "Movie added to favorites" });
  } catch (error: any) {
    console.error("Error in POST /api/users/[id]/favorite/[movieId]:", error);
    return Response.json(
      { error: error.message || "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; movieId: string }> }) {
  try {
    await connectToDB();
    const { id: userId, movieId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(movieId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    // Convert string IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const movieObjectId = new mongoose.Types.ObjectId(movieId);
    
    // Remove from user's favorites
    await UserModel.updateOne(
      { _id: userObjectId },
      { $pull: { favorites: movieObjectId } }
    );
    
    // Remove from movie's favoritedBy
    await MovieModel.updateOne(
      { _id: movieObjectId },
      { $pull: { favoritedBy: userObjectId } }
    );
    
    return Response.json({ success: true, message: "Movie removed from favorites" });
  } catch (error: any) {
    console.error("Error in POST /api/users/[id]/favorite/[movieId]:", error);
    return Response.json(
      { error: error.message || "Failed to add favorite" },
      { status: 500 }
    );
  }
}

