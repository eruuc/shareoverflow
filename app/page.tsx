"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthProvider";

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMovies() {
      try {
        const res = await axios.get("/api/movies");
        setMovies(res.data.slice(0, 6));
        setLoading(false);
      } catch (err) {
        console.error("Error loading movies:", err);
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  const handleLike = (movieId: string) => {
    if (!user) {
      alert("You must be logged in to like a movie!");
      router.push("/login");
      return;
    }
    alert("Movie added to favorites!");
  };

  const isAdmin = user && (user.role === "AdminUser" || user.roles?.includes("AdminUser") || user.roles?.includes("admin"));

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
                {isAdmin && <Link href="/admin" className="text-red-600 hover:text-red-700">Admin</Link>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  <button
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700">
                    Login
                  </Link>
                  <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {user ? `Welcome back, ${user.email?.split('@')[0]}!` : "Welcome"}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {user
              ? isAdmin
                ? "Manage movies and reviews from the Admin panel."
                : "Discover amazing movies and share your reviews."
              : "Your destination for movie reviews and recommendations."}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-300 rounded p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Search Movies</h3>
            <p className="text-gray-600">Find your favorite movies and discover new ones.</p>
          </div>

          <div className="bg-white border border-gray-300 rounded p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rate & Review</h3>
            <p className="text-gray-600">Share your thoughts and help others discover great movies.</p>
          </div>

          <div className="bg-white border border-gray-300 rounded p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Save Favorites</h3>
            <p className="text-gray-600">Create your personal collection of favorite movies.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-600 rounded p-8 text-white text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {user ? "Ready to explore?" : "Sign Up Today"}
          </h2>
          <p className="mb-6">
            {user 
              ? "Start searching for movies, writing reviews, or managing content."
              : "Create an account to start reviewing movies and building your watchlist."
            }
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <>
                <Link href="/search" className="px-6 py-2 bg-white text-blue-600 rounded hover:bg-gray-100">
                  Search Movies
                </Link>
                <Link href="/profile" className="px-6 py-2 bg-white text-blue-600 rounded hover:bg-gray-100">
                  View Profile
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/search" className="px-6 py-2 bg-white text-blue-600 rounded hover:bg-gray-100">
                  Search Movies
                </Link>
                <Link href="/register" className="px-6 py-2 bg-white text-blue-600 rounded hover:bg-gray-100">
                  Get Started
                </Link>
                <Link href="/login" className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Movies Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Movies</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading movies...</p>
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <div key={movie._id} className="bg-white border border-gray-300 rounded overflow-hidden">
                  {movie.posterURL && (
                    <div className="h-64 bg-gray-200">
                      <img 
                        src={movie.posterURL} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{movie.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{movie.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm text-gray-500">{movie.releaseYear}</span>
                        <span className="text-sm text-gray-500 ml-2">•</span>
                        <span className="text-sm text-blue-600 ml-2">{movie.genre}</span>
                      </div>
                      {user && (
                        <button
                          onClick={() => handleLike(movie._id)}
                          className="text-red-500 hover:text-red-600"
                          title="Add to favorites"
                        >
                          ❤️
                        </button>
                      )}
                    </div>
                    <Link
                      href={`/movies/${movie._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-300 rounded">
              <p className="text-gray-600 mb-4">No movies available yet.</p>
              {user && (user.role === "AdminUser" || user.roles?.includes("AdminUser") || user.roles?.includes("admin")) && (
                <Link
                  href="/admin"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Movies
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
