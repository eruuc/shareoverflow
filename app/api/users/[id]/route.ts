import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { UserModel, RegularUser, AdminUser } from "@/models/User";
import { MovieModel } from "@/models/Movie";
import { ReviewModel } from "@/models/Review";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id: userId } = await params;
    const viewerId = req.nextUrl.searchParams.get("viewerId");

    console.log(`[GET /api/users/${userId}] Looking up user with ID: ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`[GET /api/users/${userId}] Invalid user ID format: ${userId}`);
      return Response.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Convert to ObjectId for proper querying
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Try to find user - search in base model which includes all discriminators
    // The base UserModel should find users regardless of discriminator type
    console.log(`[GET /api/users/${userId}] Querying UserModel with ObjectId: ${userObjectId}`);
    let user = await UserModel.findOne({ _id: userObjectId })
      .populate("favorites")
      .populate("reviews")
      .populate("following", "_id username")
      .populate("followers", "_id username")
      .lean();

    // If still not found, try with findById as fallback
    if (!user) {
      console.log(`[GET /api/users/${userId}] UserModel.findOne failed, trying findById`);
      user = await UserModel.findById(userObjectId)
        .populate("favorites")
        .populate("reviews")
        .populate("following", "_id username")
        .populate("followers", "_id username")
        .lean();
    }

    if (!user) {
      console.error(`[GET /api/users/${userId}] User not found after trying both query methods`);
      // Try to see if any users exist in the collection
      const userCount = await UserModel.countDocuments();
      console.log(`[GET /api/users/${userId}] Total users in collection: ${userCount}`);
      return Response.json({ 
        error: "User not found",
        userId: userId,
        message: `No user found with ID: ${userId}. Make sure the user exists in the 'users' collection.`
      }, { status: 404 });
    }

    console.log(`[GET /api/users/${userId}] User found: ${user.username || user.email}`);

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
  } catch (error: any) {
    console.error("Error in GET /api/users/[id]:", error);
    return Response.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id: userId } = await params;
    const body = await req.json();
    const { email, phone } = body;
    const update: any = {};
    if (email) update.email = email;
    if (phone) update.phone = phone;
    await UserModel.updateOne({ _id: userId }, { $set: update });
    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error in PATCH /api/users/[id]:", error);
    return Response.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

