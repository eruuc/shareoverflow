"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../AuthProvider";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: "",
    posterURL: "",
    genre: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const isAdmin = user.role === "AdminUser" || user.roles?.includes("AdminUser") || user.roles?.includes("admin");
    if (!isAdmin) {
      router.push("/");
      return;
    }
    loadMovies();
  }, [user, router]);

  async function loadMovies() {
    const res = await axios.get("/api/movies");
    setMovies(res.data);
    setLoading(false);
  }

  async function handleCreate() {
    await axios.post("/api/movies", {
      ...formData,
      releaseYear: parseInt(formData.releaseYear),
      reviews: [],
      favoritedBy: [],
    });
    setShowCreateForm(false);
    setFormData({ title: "", description: "", releaseYear: "", posterURL: "", genre: "" });
    loadMovies();
  }

  async function handleUpdate() {
    await axios.put(`/api/movies/${editingMovie._id}`, {
      ...formData,
      releaseYear: parseInt(formData.releaseYear),
    });
    setEditingMovie(null);
    setFormData({ title: "", description: "", releaseYear: "", posterURL: "", genre: "" });
    loadMovies();
  }

  async function handleDelete(movieId: string) {
    if (confirm("Delete this movie?")) {
      await axios.delete(`/api/movies/${movieId}`);
      loadMovies();
    }
  }

  if (!user) {
    return <div className="p-8 bg-gray-100 min-h-screen text-gray-900">Please log in.</div>;
  }

  const isAdmin = user.role === "AdminUser" || user.roles?.includes("AdminUser") || user.roles?.includes("admin");
  if (!isAdmin) {
    return <div className="p-8 bg-gray-100 min-h-screen text-gray-900 font-bold">Access Denied. Admin only.</div>;
  }

  if (loading) return <div className="p-8 bg-gray-100 min-h-screen text-gray-900">Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel - Movie Management</h1>
            <Link href="/" className="text-blue-600 font-medium">Home</Link>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingMovie(null);
              setFormData({ title: "", description: "", releaseYear: "", posterURL: "", genre: "" });
            }}
            className="bg-green-600 text-white px-6 py-2 rounded font-medium"
          >
            {showCreateForm ? "Cancel" : "+ Create New Movie"}
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingMovie) && (
          <div className="bg-white border-2 border-gray-400 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{editingMovie ? "Edit Movie" : "Create Movie"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 font-bold mb-2">Title</label>
                <input
                  placeholder="Movie Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-900 font-bold mb-2">Description</label>
                <textarea
                  placeholder="Movie Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-gray-900 font-bold mb-2">Release Year</label>
                <input
                  placeholder="Release Year"
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                  className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-900 font-bold mb-2">Poster URL</label>
                <input
                  placeholder="Image URL"
                  value={formData.posterURL}
                  onChange={(e) => setFormData({ ...formData, posterURL: e.target.value })}
                  className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-900 font-bold mb-2">Genre</label>
                <input
                  placeholder="Genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                />
              </div>
              <button
                onClick={editingMovie ? handleUpdate : handleCreate}
                className="bg-blue-600 text-white px-6 py-2 rounded font-medium"
              >
                {editingMovie ? "Update" : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* All Movies List */}
        <div className="bg-white border-2 border-gray-400 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-gray-300">All Movies</h2>
          <div className="space-y-3">
            {movies.map((movie) => (
              <div key={movie._id} className="border-2 border-gray-300 p-4 rounded flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{movie.title} ({movie.releaseYear})</h3>
                  <p className="text-gray-700 font-medium">{movie.genre}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingMovie(movie);
                      setShowCreateForm(false);
                      setFormData({
                        title: movie.title,
                        description: movie.description,
                        releaseYear: movie.releaseYear.toString(),
                        posterURL: movie.posterURL,
                        genre: movie.genre,
                      });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(movie._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
