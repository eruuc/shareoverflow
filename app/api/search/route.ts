import { NextRequest } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q");
    const page = searchParams.get("page") || "1";

    if (!query) {
      return Response.json({ error: "Search query is required" }, { status: 400 });
    }

    // OMDB API - Get a free API key from http://www.omdbapi.com/apikey.aspx
    const omdbApiKey = process.env.OMDB_API_KEY;
    
    if (!omdbApiKey || omdbApiKey === "demo") {
      return Response.json({ 
        error: "OMDB API key is required. Please set OMDB_API_KEY in your .env.local file. Get a free key from http://www.omdbapi.com/apikey.aspx",
        Search: [],
        totalResults: "0"
      }, { status: 401 });
    }

    const omdbUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(query)}&page=${page}&type=movie`;

    const response = await axios.get(omdbUrl);
    
    // Check for API errors
    if (response.data.Response === "False") {
      const errorMessage = response.data.Error || "No results found";
      
      // Check if it's an authentication error
      if (errorMessage.toLowerCase().includes("invalid api key") || 
          errorMessage.toLowerCase().includes("request limit") ||
          response.status === 401) {
        return Response.json({ 
          error: "OMDB API authentication failed. Please check your API key in .env.local",
          Search: [],
          totalResults: "0"
        }, { status: 401 });
      }
      
      return Response.json({ 
        error: errorMessage,
        Search: [],
        totalResults: "0"
      });
    }

    return Response.json(response.data);
  } catch (error: any) {
    console.error("Error in GET /api/search:", error);
    
    // Handle axios errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return Response.json({ 
          error: "OMDB API authentication failed. Please check your API key in .env.local file. Get a free key from http://www.omdbapi.com/apikey.aspx",
          Search: [],
          totalResults: "0"
        }, { status: 401 });
      }
      
      if (status === 403) {
        return Response.json({ 
          error: "OMDB API access forbidden. Your API key may have exceeded the rate limit.",
          Search: [],
          totalResults: "0"
        }, { status: 403 });
      }
      
      return Response.json(
        { 
          error: data?.Error || data?.error || `OMDB API error: ${status}`,
          Search: [],
          totalResults: "0"
        },
        { status: status }
      );
    }
    
    return Response.json(
      { 
        error: error.message || "Failed to search movies. Please check your internet connection and try again.",
        Search: [],
        totalResults: "0"
      },
      { status: 500 }
    );
  }
}

