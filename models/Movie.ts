import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  releaseYear: Number,
  posterURL: String,
  genre: String,
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { collection: 'movies' });

export const MovieModel = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

