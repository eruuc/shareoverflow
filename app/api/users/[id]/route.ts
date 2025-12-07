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
    // Note: We don't populate reviews here since we handle it manually below
    console.log(`[GET /api/users/${userId}] Querying UserModel with ObjectId: ${userObjectId}`);
    let user = await UserModel.findOne({ _id: userObjectId })
      .populate("favorites")
      .populate("following", "_id username")
      .populate("followers", "_id username")
      .lean();

    // If still not found, try with findById as fallback
    if (!user) {
      console.log(`[GET /api/users/${userId}] UserModel.findOne failed, trying findById`);
      user = await UserModel.findById(userObjectId)
        .populate("favorites")
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

    // Manually populate reviews since we removed it from the query
    // This avoids the Review model registration issue with populate
    if (user.reviews && Array.isArray(user.reviews) && user.reviews.length > 0) {
      // Check if reviews are ObjectIds (not yet populated) or already objects
      const firstReview = user.reviews[0];
      const isObjectId = firstReview instanceof mongoose.Types.ObjectId || 
                        (typeof firstReview === 'string' && mongoose.Types.ObjectId.isValid(firstReview));
      
      if (isObjectId) {
        // Reviews are ObjectIds, fetch them
        const reviewIds = user.reviews.map((r: any) => 
          r instanceof mongoose.Types.ObjectId ? r : new mongoose.Types.ObjectId(r)
        );
        const reviews = await ReviewModel.find({ _id: { $in: reviewIds } }).lean();
        const movieIds = reviews.map((r: any) => r.movieId).filter((id: any) => id);
        const movies = movieIds.length > 0 
          ? await MovieModel.find({ _id: { $in: movieIds } }).lean()
          : [];
        user.reviews = reviews.map((r: any) => ({
          ...r,
          _id: r._id.toString(),
          movie: movies.find((m: any) => m._id.toString() === r.movieId?.toString()),
        }));
      } else {
        // Reviews are already populated objects, just add movie info
        const movieIds = user.reviews.map((r: any) => r.movieId).filter((id: any) => id);
        if (movieIds.length > 0) {
          const movies = await MovieModel.find({ _id: { $in: movieIds } }).lean();
          user.reviews = user.reviews.map((r: any) => ({
            ...r,
            movie: movies.find((m: any) => m._id.toString() === r.movieId?.toString()),
          }));
        }
      }
    } else {
      user.reviews = [];
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

