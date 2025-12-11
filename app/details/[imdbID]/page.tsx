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

interface Review {
  _id: string;
  rating: number;
  comment: string;
  userId: {
    _id: string;
    username: string;
    email?: string;
  };
  createdAt: string;
}

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const imdbID = params?.imdbID as string;
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [localMovie, setLocalMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  useEffect(() => {
    async function loadMovieDetails() {
      if (!imdbID) return;

      try {
        setLoading(true);
        setError("");

        // Fetch movie details from remote API (OMDB)
        const movieRes = await axios.get(`/api/search/${imdbID}`);
        setMovie(movieRes.data);

        // Check if movie exists in local database and fetch reviews
        try {
          // Search for movie by title and year in local database
          const localMovieRes = await axios.get(`/api/movies`);
          const localMovies = localMovieRes.data;
          const foundLocalMovie = localMovies.find(
            (m: any) => m.title === movieRes.data.Title && m.releaseYear === parseInt(movieRes.data.Year)
          );

          if (foundLocalMovie) {
            setLocalMovie(foundLocalMovie);
            
            // Fetch reviews for this movie
            const reviewsRes = await axios.get(`/api/movies/${foundLocalMovie._id}/reviews`);
            const reviewsData = reviewsRes.data;
            
            // Fetch user info for each review
            const reviewsWithUsers = await Promise.all(
              reviewsData.map(async (review: any) => {
                try {
                  const userId = typeof review.userId === 'object' ? review.userId._id : review.userId;
                  const userRes = await axios.get(`/api/users/${userId}?viewerId=${userId}`);
                  return {
                    ...review,
                    userId: {
                      _id: userRes.data._id || userId,
                      username: userRes.data.username || "Unknown User",
                      email: userRes.data.email
                    }
                  };
                } catch {
                  return {
                    ...review,
                    userId: {
                      _id: typeof review.userId === 'object' ? review.userId._id : review.userId,
                      username: "Unknown User"
                    }
                  };
                }
              })
            );
            
            setReviews(reviewsWithUsers);

            // Check if user has favorited this movie
            if (user?._id) {
              const favoritedIds = foundLocalMovie.favoritedBy?.map((u: any) => 
                typeof u === 'string' ? u : u._id?.toString() || u.toString()
              ) || [];
              setIsFavorited(favoritedIds.includes(user._id));
            }
          }
        } catch (localErr) {
          console.log("Movie not found in local database or error fetching local data:", localErr);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error loading movie details:", err);
        setError(err.response?.data?.error || "Failed to load movie details");
        setLoading(false);
      }
    }

    loadMovieDetails();
  }, [imdbID, user]);

  const handleFavorite = async () => {
    if (!user) {
      alert("You must be logged in to favorite movies!");
      router.push("/login");
      return;
    }

    if (!localMovie) {
      alert("This movie is not in our database. Please add it first.");
      return;
    }

    if (isFavoriting) return; // Prevent multiple clicks

    setIsFavoriting(true);
    try {
      if (isFavorited) {
        await axios.delete(`/api/users/${user._id}/favorite/${localMovie._id}`);
        setIsFavorited(false);
      } else {
        await axios.post(`/api/users/${user._id}/favorite/${localMovie._id}`);
        setIsFavorited(true);
      }
    } catch (err: any) {
      console.error("Error favoriting movie:", err);
      alert(err.response?.data?.error || "Failed to update favorite status. Please try again.");
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to write reviews!");
      router.push("/login");
      return;
    }

    if (!localMovie) {
      alert("This movie is not in our database. Please add it first.");
      return;
    }

    try {
      await axios.post(`/api/movies/${localMovie._id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userId: user._id
      });
      
      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      
      // Reload reviews
      const reviewsRes = await axios.get(`/api/movies/${localMovie._id}/reviews`);
      const reviewsData = reviewsRes.data;
      
      const reviewsWithUsers = await Promise.all(
        reviewsData.map(async (review: any) => {
          try {
            const userId = typeof review.userId === 'object' ? review.userId._id : review.userId;
            const userRes = await axios.get(`/api/users/${userId}?viewerId=${userId}`);
            return {
              ...review,
              userId: {
                _id: userRes.data._id || userId,
                username: userRes.data.username || "Unknown User",
                email: userRes.data.email
              }
            };
          } catch {
            return {
              ...review,
              userId: {
                _id: typeof review.userId === 'object' ? review.userId._id : review.userId,
                username: "Unknown User"
              }
            };
          }
        })
      );
      
      setReviews(reviewsWithUsers);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review");
    }
  };

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
              <div className="flex items-start justify-between mb-4">
                <div>
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
                        <span className="font-bold text-yellow-600">⭐ {movie.imdbRating}/10</span>
                      </>
                    )}
                  </div>
                </div>
                {localMovie && user && (
                  <button
                    onClick={handleFavorite}
                    disabled={isFavoriting}
                    className={`px-4 py-2 rounded-md font-medium text-white transition-all duration-200 transform ${
                      isFavorited 
                        ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-md" 
                        : "bg-gray-400 hover:bg-red-500 hover:scale-105"
                    } ${isFavoriting ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                    title={isFavoriting ? "Updating..." : isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isFavoriting ? "Updating..." : isFavorited ? "❤️ Favorited" : "🤍 Favorite"}
                  </button>
                )}
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

              {!localMovie && user && (
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded p-4 mt-4">
                  <p className="text-yellow-900">
                    This movie is not in our local database. Only movies in our database can be favorited or reviewed.
                  </p>
                </div>
              )}

              {!user && (
                <div className="bg-blue-100 border-2 border-blue-400 rounded p-4 mt-4">
                  <p className="text-blue-900">
                    <Link href="/login" className="font-bold underline">Login</Link> to favorite this movie or write a review!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Local Reviews Section */}
        {localMovie && (
          <div className="bg-white border-2 border-gray-400 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900">
                Local Reviews ({reviews.length})
              </h2>
              {user && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                >
                  {showReviewForm ? "Cancel" : "+ Write Review"}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && user && (
              <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-100 border-2 border-gray-300 rounded">
                <div className="mb-4">
                  <label className="block text-gray-900 font-bold mb-2">Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                  >
                    {[5, 4, 3, 2, 1].map(r => (
                      <option key={r} value={r}>{r} Stars</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-bold mb-2">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                    rows={5}
                    placeholder="Write your review..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700"
                >
                  Submit Review
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-l-4 border-blue-600 pl-4 py-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${review.userId._id}`}
                          className="font-bold text-gray-900 hover:text-blue-600"
                        >
                          {review.userId.username}
                        </Link>
                        <span className="text-gray-600">•</span>
                        <span className="text-yellow-600 font-bold">
                          {review.rating} ⭐
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 italic">
                {localMovie ? "No reviews yet. Be the first to review this movie!" : "This movie is not in our local database."}
              </p>
            )}
          </div>
        )}

        {!localMovie && (
          <div className="bg-white border-2 border-gray-400 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Local Reviews</h2>
            <p className="text-gray-700 italic">
              This movie is not in our local database, so there are no local reviews yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

