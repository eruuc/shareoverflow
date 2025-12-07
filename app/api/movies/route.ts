import { NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { MovieModel } from "@/models/Movie";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    
    const { searchParams } = req.nextUrl;
    const genre = searchParams.get("genre");
    const year = searchParams.get("year");
    const limit = searchParams.get("limit");
    
    let query: any = {};
    
    if (genre) {
      query.genre = genre;
    }
    
    if (year) {
      query.releaseYear = parseInt(year);
    }
    
    let moviesQuery = MovieModel.find(query);
    
    if (limit) {
      moviesQuery = moviesQuery.limit(parseInt(limit));
    }
    
    const movies = await moviesQuery.lean();
    return Response.json(movies);
  } catch (error: any) {
    console.error("Error in GET /api/movies:", error);
    return Response.json(
      { error: error.message || "Failed to fetch movies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();
    const { title, description, releaseYear, posterURL, genre } = body;
    
    if (!title || !description || !releaseYear || !genre) {
      return Response.json({ error: "Title, description, releaseYear, and genre are required" }, { status: 400 });
    }
    
    const movie = new MovieModel({
      title,
      description,
      releaseYear: parseInt(releaseYear),
      posterURL: posterURL || "",
      genre,
      reviews: [],
      favoritedBy: []
    });
    
    const savedMovie = await movie.save();
    return Response.json(savedMovie, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/movies:", error);
    return Response.json(
      { error: error.message || "Failed to create movie" },
      { status: 500 }
    );
  }
}

