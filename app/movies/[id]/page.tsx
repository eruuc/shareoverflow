"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../AuthProvider";

export default function MovieDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [movie, setMovie] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    async function loadMovie() {
      try {
        const res = await axios.get(`/api/movies/${id}`);
        const movieData = res.data;
        setMovie(movieData);
        
        const favoritedIds = movieData.favoritedBy?.map((u: any) => 
          typeof u === 'string' ? u : u._id?.toString() || u.toString()
        ) || [];
        setIsFavorited(user?._id && favoritedIds.includes(user._id));
        
        if (movieData.reviews && movieData.reviews.length > 0) {
          setReviews(movieData.reviews);
        }
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading movie:", err);
        if (err.response?.status === 404) {
          setMovie(null);
        }
        setLoading(false);
      }
    }
    if (id) loadMovie();
  }, [id, user]);

  const handleFavorite = async () => {
    if (!user) {
      alert("You must be logged in to favorite movies!");
      router.push("/login");
      return;
    }
    
    if (isFavoriting) return; // Prevent multiple clicks
    
    setIsFavoriting(true);
    try {
      if (isFavorited) {
        await axios.delete(`/api/users/${user._id}/favorite/${id}`);
        setIsFavorited(false);
      } else {
        await axios.post(`/api/users/${user._id}/favorite/${id}`);
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
    try {
      await axios.post(`/api/movies/${id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userId: user._id
      });
      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      const res = await axios.get(`/api/movies/${id}`);
      setMovie(res.data);
      if (res.data.reviews && res.data.reviews.length > 0) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review");
    }
  };

  if (loading) return <div className="p-8 bg-gray-100 min-h-screen text-center text-gray-900">Loading...</div>;
  if (!movie) return <div className="p-8 bg-gray-100 min-h-screen text-center text-red-600 font-bold">Movie not found</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link href="/" className="text-blue-600 font-medium mb-6 inline-block">
          ← Back to Home
        </Link>

        {/* Movie Header */}
        <div className="bg-white border-2 border-gray-400 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {movie.posterURL && (
              <div>
                <img 
                  src={movie.posterURL} 
                  alt={movie.title}
                  className="w-48 h-72 object-cover rounded border-2 border-gray-400"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{movie.title}</h1>
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="font-medium">{movie.releaseYear}</span>
                    <span>•</span>
                    <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded font-medium">
                      {movie.genre}
                    </span>
                  </div>
                </div>
                {user && (
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
              <p className="text-gray-900 mb-4 leading-relaxed">{movie.description}</p>
              {!user && (
                <div className="bg-blue-100 border-2 border-blue-400 rounded p-4">
                  <p className="text-blue-900">
                    <Link href="/login" className="font-bold underline">Login</Link> to favorite this movie or write a review!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white border-2 border-gray-400 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900">Reviews ({reviews.length})</h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
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
                className="bg-blue-600 text-white px-6 py-2 rounded font-medium"
              >
                Submit Review
              </button>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review._id} className="border-l-4 border-blue-600 pl-4 py-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/profile/${review.userId?._id || review.userId}`}
                        className="font-bold text-gray-900"
                      >
                        {review.user?.username || review.userId?.username || "User"}
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
            <p className="text-gray-700 italic">No reviews yet. Be the first to review this movie!</p>
          )}
        </div>
      </div>
    </div>
  );
}
