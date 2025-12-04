import { NextRequest } from "next/server";
import axios from "axios";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imdbID: string }> }
) {
  try {
    const { imdbID } = await params;

    if (!imdbID) {
      return Response.json({ error: "IMDB ID is required" }, { status: 400 });
    }

    // OMDB API - Get a free API key from http://www.omdbapi.com/apikey.aspx
    const omdbApiKey = process.env.OMDB_API_KEY;
    
    if (!omdbApiKey || omdbApiKey === "demo") {
      return Response.json({ 
        error: "OMDB API key is required. Please set OMDB_API_KEY in your .env.local file. Get a free key from http://www.omdbapi.com/apikey.aspx"
      }, { status: 401 });
    }

    const omdbUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&i=${encodeURIComponent(imdbID)}&plot=full`;

    const response = await axios.get(omdbUrl);
    
    // Check for API errors
    if (response.data.Response === "False") {
      const errorMessage = response.data.Error || "Movie not found";
      
      // Check if it's an authentication error
      if (errorMessage.toLowerCase().includes("invalid api key") || 
          errorMessage.toLowerCase().includes("request limit") ||
          response.status === 401) {
        return Response.json({ 
          error: "OMDB API authentication failed. Please check your API key in .env.local"
        }, { status: 401 });
      }
      
      return Response.json({ 
        error: errorMessage
      }, { status: 404 });
    }

    return Response.json(response.data);
  } catch (error: any) {
    console.error("Error in GET /api/search/[imdbID]:", error);
    
    // Handle axios errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return Response.json({ 
          error: "OMDB API authentication failed. Please check your API key in .env.local file. Get a free key from http://www.omdbapi.com/apikey.aspx"
        }, { status: 401 });
      }
      
      if (status === 403) {
        return Response.json({ 
          error: "OMDB API access forbidden. Your API key may have exceeded the rate limit."
        }, { status: 403 });
      }
      
      return Response.json(
        { 
          error: data?.Error || data?.error || `OMDB API error: ${status}`
        },
        { status: status }
      );
    }
    
    return Response.json(
      { 
        error: error.message || "Failed to fetch movie details. Please check your internet connection and try again."
      },
      { status: 500 }
    );
  }
}

