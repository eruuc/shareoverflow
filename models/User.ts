import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { discriminatorKey: 'role', collection: 'users' });

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

// Check if discriminators already exist before creating them
let RegularUser: any;
let AdminUser: any;

if (UserModel.discriminators && UserModel.discriminators["RegularUser"]) {
  RegularUser = UserModel.discriminators["RegularUser"];
} else {
  RegularUser = UserModel.discriminator("RegularUser", new mongoose.Schema({
    joinDate: Date,
  }));
}

if (UserModel.discriminators && UserModel.discriminators["AdminUser"]) {
  AdminUser = UserModel.discriminators["AdminUser"];
} else {
  AdminUser = UserModel.discriminator("AdminUser", new mongoose.Schema({
    permissionsLevel: Number,
    canDeleteMovies: Boolean,
    canRemoveReviews: Boolean,
  }));
}

export { RegularUser, AdminUser };

