"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "../../AuthProvider";

interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const imdbID = params?.imdbID as string;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMovieDetails() {
      if (!imdbID) return;

      try {
        setLoading(true);
        setError("");

        const movieRes = await axios.get(`/api/search/${imdbID}`);
        setMovie(movieRes.data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading movie details:", err);
        setError(err.response?.data?.error || "Failed to load movie details");
        setLoading(false);
      }
    }

    loadMovieDetails();
  }, [imdbID]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-900 text-lg">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie || movie.Response === "False") {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white border-2 border-red-400 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-900 mb-4">{error || "Movie not found"}</p>
          <Link href="/search" className="text-blue-600 hover:text-blue-700">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600">
                ShareOverflow
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
                <Link href="/search" className="text-gray-700 hover:text-blue-600">Search</Link>
                {user && <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              ) : (
                <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/search" className="text-blue-600 font-medium mb-6 inline-block hover:text-blue-700">
          ← Back to Search
        </Link>

        {/* Movie Details from Remote API */}
        <div className="bg-white border-2 border-gray-400 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {movie.Poster && movie.Poster !== "N/A" ? (
              <div className="flex-shrink-0">
                <img
                  src={movie.Poster}
                  alt={movie.Title}
                  className="w-64 h-96 object-cover rounded border-2 border-gray-400"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-64 h-96 bg-gray-300 rounded border-2 border-gray-400 flex items-center justify-center">
                <span className="text-gray-500">No Poster</span>
              </div>
            )}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{movie.Title}</h1>
                <div className="flex items-center gap-3 text-gray-700 mb-4">
                  <span className="font-medium">{movie.Year}</span>
                  <span>•</span>
                  <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded font-medium">
                    {movie.Genre}
                  </span>
                  {movie.imdbRating && movie.imdbRating !== "N/A" && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-yellow-600">{movie.imdbRating}/10</span>
                    </>
                  )}
                </div>
              </div>

              {/* Movie Info */}
              <div className="space-y-2 mb-4 text-gray-900">
                {movie.Plot && movie.Plot !== "N/A" && (
                  <p className="leading-relaxed">{movie.Plot}</p>
                )}
                {movie.Director && movie.Director !== "N/A" && (
                  <p><strong>Director:</strong> {movie.Director}</p>
                )}
                {movie.Actors && movie.Actors !== "N/A" && (
                  <p><strong>Actors:</strong> {movie.Actors}</p>
                )}
                {movie.Writer && movie.Writer !== "N/A" && (
                  <p><strong>Writer:</strong> {movie.Writer}</p>
                )}
                {movie.Runtime && movie.Runtime !== "N/A" && (
                  <p><strong>Runtime:</strong> {movie.Runtime}</p>
                )}
                {movie.Rated && movie.Rated !== "N/A" && (
                  <p><strong>Rated:</strong> {movie.Rated}</p>
                )}
                {movie.Released && movie.Released !== "N/A" && (
                  <p><strong>Released:</strong> {movie.Released}</p>
                )}
                {movie.Country && movie.Country !== "N/A" && (
                  <p><strong>Country:</strong> {movie.Country}</p>
                )}
                {movie.Language && movie.Language !== "N/A" && (
                  <p><strong>Language:</strong> {movie.Language}</p>
                )}
                {movie.Awards && movie.Awards !== "N/A" && (
                  <p><strong>Awards:</strong> {movie.Awards}</p>
                )}
              </div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

