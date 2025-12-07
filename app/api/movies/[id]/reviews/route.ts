import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { MovieModel } from "@/models/Movie";
import { ReviewModel } from "@/models/Review";
import { UserModel } from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid movie ID format" }, { status: 400 });
    }
    
    const reviews = await ReviewModel.find({ movieId: id })
      .populate("userId", "_id username")
      .populate("movieId", "_id title")
      .sort({ createdAt: -1 })
      .lean();
    
    return Response.json(reviews);
  } catch (error: any) {
    console.error("Error in GET /api/movies/[id]/reviews:", error);
    return Response.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const { rating, comment, userId } = body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid movie ID format" }, { status: 400 });
    }
    
    if (!rating || !comment || !userId) {
      return Response.json({ error: "Rating, comment, and userId are required" }, { status: 400 });
    }
    
    // Verify movie exists
    const movie = await MovieModel.findById(id);
    if (!movie) {
      return Response.json({ error: "Movie not found" }, { status: 404 });
    }
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    // Create review
    const review = new ReviewModel({
      rating: parseInt(rating),
      comment,
      movieId: id,
      userId: userId,
      createdAt: new Date()
    });
    
    const savedReview = await review.save();
    
    // Update movie to include review reference
    await MovieModel.updateOne(
      { _id: id },
      { $addToSet: { reviews: savedReview._id } }
    );
    
    // Update user to include review reference
    await UserModel.updateOne(
      { _id: userId },
      { $addToSet: { reviews: savedReview._id } }
    );
    
    return Response.json(savedReview, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/movies/[id]/reviews:", error);
    return Response.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}

