import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function POST(req: NextRequest) {
  await connectToDB();
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await UserModel.findOne({ email }).lean();
  
  if (!user) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.password !== password) { // TODO: Implement proper password hashing
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!user._id) {
    return Response.json({ error: "User data error: missing ID" }, { status: 500 });
  }

  const { password: _, ...userWithoutPassword } = user;
  return Response.json({
    _id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role || "RegularUser",
    roles: [user.role || "RegularUser"],
  });
}

