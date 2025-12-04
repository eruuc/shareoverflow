import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { RegularUser } from "@/models/User";

export async function POST(req: NextRequest) {
  await connectToDB();
  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return Response.json({ error: "Email, password, and username are required" }, { status: 400 });
  }

  // Check if user already exists
  const existing = await RegularUser.findOne({ email });
  if (existing) {
    return Response.json({ error: "User with this email already exists" }, { status: 400 });
  }

  // Create regular user
  const user = new RegularUser({
    username: username,
    email: email,
    password: password, // TODO: Hash password
    joinDate: new Date(),
    favorites: [],
    reviews: [],
    following: [],
    followers: []
  });

  await user.save();

  return Response.json({
    _id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role || "RegularUser",
    roles: [user.role || "RegularUser"],
  });
}

