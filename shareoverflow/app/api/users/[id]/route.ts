import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { MovieModel } from "@/models/Movie";
import { ReviewModel } from "@/models/Review";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id: userId } = await params;
  const viewerId = req.nextUrl.searchParams.get("viewerId");

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Response.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  const user = await UserModel.findById(userId)
    .populate("favorites")
    .populate("reviews")
    .populate("following", "_id username")
    .populate("followers", "_id username")
    .lean();

  if (!user) {
    return Response.json({ 
      error: "User not found",
      userId: userId,
      message: `No user found with ID: ${userId}. Make sure the user exists in the 'users' collection.`
    }, { status: 404 });
  }

  if (user.reviews) {
    const movieIds = user.reviews.map((r: any) => r.movieId);
    const movies = await MovieModel.find({ _id: { $in: movieIds } });
    user.reviews = user.reviews.map((r: any) => ({
      ...r,
      movie: movies.find((m) => m._id.equals(r.movieId)),
    }));
  }

  if (!viewerId || viewerId !== userId) {
    delete user.email;
    delete user.phone;
  }
  return Response.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id: userId } = await params;
  const body = await req.json();
  const { email, phone } = body;
  const update: any = {};
  if (email) update.email = email;
  if (phone) update.phone = phone;
  await UserModel.updateOne({ _id: userId }, { $set: update });
  return Response.json({ success: true });
}

