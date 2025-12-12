const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { discriminatorKey: 'role', collection: 'users' });

let UserModel;
if (mongoose.models.User) {
  UserModel = mongoose.models.User;
} else {
  UserModel = mongoose.model('User', userSchema);
}

// Check if discriminators already exist before creating them
let RegularUser;
let AdminUser;

if (UserModel.discriminators && UserModel.discriminators['RegularUser']) {
  RegularUser = UserModel.discriminators['RegularUser'];
} else {
  RegularUser = UserModel.discriminator('RegularUser', new mongoose.Schema({
    joinDate: Date,
  }));
}

if (UserModel.discriminators && UserModel.discriminators['AdminUser']) {
  AdminUser = UserModel.discriminators['AdminUser'];
} else {
  AdminUser = UserModel.discriminator('AdminUser', new mongoose.Schema({
    permissionsLevel: Number,
    canDeleteMovies: Boolean,
    canRemoveReviews: Boolean,
  }));
}

module.exports = { UserModel, RegularUser, AdminUser };
