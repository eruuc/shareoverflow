import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { ReviewModel } from "@/models/Review";
import { UserModel } from "@/models/User";
import { MovieModel } from "@/models/Movie";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid review ID format" }, { status: 400 });
  }

  const review = await ReviewModel.findById(id)
    .populate("userId", "_id username")
    .populate("movieId", "_id title")
    .lean();

  if (!review) {
    return Response.json({ error: "Review not found" }, { status: 404 });
  }

  return Response.json(review);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid review ID format" }, { status: 400 });
  }

  const review = await ReviewModel.findById(id);

  if (!review) {
    return Response.json({ error: "Review not found" }, { status: 404 });
  }

  // Remove review reference from movie
  await MovieModel.updateOne(
    { _id: review.movieId },
    { $pull: { reviews: review._id } }
  );

  // Remove review reference from user
  await UserModel.updateOne(
    { _id: review.userId },
    { $pull: { reviews: review._id } }
  );

  // Delete the review
  await ReviewModel.findByIdAndDelete(id);

  return Response.json({ message: "Review deleted successfully", deletedId: id });
}

