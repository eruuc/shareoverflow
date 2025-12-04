import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { MovieModel } from "@/models/Movie";
import { ReviewModel } from "@/models/Review";
import { UserModel } from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid movie ID format" }, { status: 400 });
  }
  
  const movie = await MovieModel.findById(id)
    .populate("reviews")
    .populate("favoritedBy", "_id username email")
    .lean();
  
  if (!movie) {
    return Response.json({ error: "Movie not found" }, { status: 404 });
  }
  
  // Populate user info for reviews
  if (movie.reviews && movie.reviews.length > 0) {
    const reviewsWithUsers = await Promise.all(
      (movie.reviews as any[]).map(async (review: any) => {
        if (review.userId) {
          const user = await UserModel.findById(review.userId).select("username email").lean();
          return { ...review, user };
        }
        return review;
      })
    );
    movie.reviews = reviewsWithUsers as any;
  }
  
  return Response.json(movie);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await params;
  const body = await req.json();
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid movie ID format" }, { status: 400 });
  }
  
  const { title, description, releaseYear, posterURL, genre } = body;
  const updateData: any = {};
  
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (releaseYear) updateData.releaseYear = parseInt(releaseYear);
  if (posterURL !== undefined) updateData.posterURL = posterURL;
  if (genre) updateData.genre = genre;
  
  const movie = await MovieModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  
  if (!movie) {
    return Response.json({ error: "Movie not found" }, { status: 404 });
  }
  
  return Response.json(movie);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid movie ID format" }, { status: 400 });
  }
  
  const movie = await MovieModel.findByIdAndUpdate(
    id,
    { $set: await req.json() },
    { new: true, runValidators: true }
  );
  
  if (!movie) {
    return Response.json({ error: "Movie not found" }, { status: 404 });
  }
  
  return Response.json(movie);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid movie ID format" }, { status: 400 });
  }
  
  const movie = await MovieModel.findByIdAndDelete(id);
  
  if (!movie) {
    return Response.json({ error: "Movie not found" }, { status: 404 });
  }
  
  return Response.json({ message: "Movie deleted successfully", deletedId: id });
}

