"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../AuthProvider";

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const userId = authUser?._id;
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios.get(`/api/users/${userId}?viewerId=${userId}`)
      .then(res => {
        setProfileData(res.data);
        setEmail(res.data.email || "");
        setPhone(res.data.phone || "");
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setLoading(false);
        if (err.response?.status === 404) {
          setProfileData(null);
        }
      });
  }, [userId]);

  if (!authUser || !userId) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen">
        <p className="text-gray-900">Please log in to view your profile.</p>
        <Link href="/login" className="text-blue-600">Go to Login</Link>
      </div>
    );
  }
  if (loading) return <div className="p-8 bg-gray-100 min-h-screen text-gray-900">Loading...</div>;
  if (!profileData) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen">
        <p className="text-gray-900 font-bold">User Not Found</p>
        <Link href="/login" className="text-blue-600">Go to Login</Link>
      </div>
    );
  }

  async function handleSave() {
    setSavedMsg("");
    await axios.patch(`/api/users/${userId}`, { email, phone });
    setSavedMsg("Saved!");
    setEditing(false);
    setProfileData((old: any) => ({ ...old, email, phone }));
  }

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-700 mb-4">Manage your account settings</p>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 font-medium">← Home</Link>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* User Info Banner */}
        <div className="bg-blue-600 text-white p-6 mb-6 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {profileData.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profileData.username}</h2>
              <p className="text-lg">{profileData.role}</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Details */}
          <div className="bg-white border-2 border-gray-400 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Public Details</h2>
            <div className="space-y-2">
              <p className="text-gray-900"><strong>Username:</strong> {profileData.username}</p>
              <p className="text-gray-900"><strong>Role:</strong> {profileData.role}</p>
            </div>
          </div>

          {/* Private Details */}
          <div className="bg-white border-2 border-gray-400 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-300">
              <h2 className="text-xl font-bold text-gray-900">Private Details</h2>
              {!editing && (
                <button 
                  onClick={() => setEditing(true)}
                  className="bg-gray-300 text-gray-900 px-4 py-2 rounded font-medium"
                >
                  Edit
                </button>
              )}
            </div>
            {editing ? (
              <div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-medium mb-2">Email</label>
                  <input 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-900 font-medium mb-2">Phone</label>
                  <input 
                    type="tel"
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="w-full border-2 border-gray-400 rounded px-3 py-2 text-gray-900"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-6 py-2 rounded font-medium"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditing(false);
                      setEmail(profileData.email || "");
                      setPhone(profileData.phone || "");
                    }}
                    className="bg-gray-300 text-gray-900 px-6 py-2 rounded font-medium"
                  >
                    Cancel
                  </button>
                </div>
                {savedMsg && <p className="mt-3 text-green-700 font-medium">{savedMsg}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-900"><strong>Email:</strong> {profileData.email || "(not set)"}</p>
                <p className="text-gray-900"><strong>Phone:</strong> {profileData.phone || "(not set)"}</p>
              </div>
            )}
          </div>

          {/* Following */}
          <div className="bg-white border-2 border-gray-400 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Following</h2>
            {profileData.following && profileData.following.length ? (
              <ul className="space-y-2">
                {profileData.following.map((u: any) => (
                  <li key={u._id}>
                    <Link href={`/profile/${u._id}`} className="text-blue-600 font-medium">
                      @{u.username}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">Not following anyone yet.</p>
            )}
          </div>

          {/* Followers */}
          <div className="bg-white border-2 border-gray-400 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Followers</h2>
            {profileData.followers && profileData.followers.length ? (
              <ul className="space-y-2">
                {profileData.followers.map((u: any) => (
                  <li key={u._id}>
                    <Link href={`/profile/${u._id}`} className="text-blue-600 font-medium">
                      @{u.username}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No followers yet.</p>
            )}
          </div>

          {/* Favorites */}
          <div className="bg-white border-2 border-gray-400 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Favorites</h2>
            {profileData.favorites && profileData.favorites.length ? (
              <ul className="space-y-2">
                {profileData.favorites.map((movie: any) => (
                  <li key={movie._id}>
                    <Link href={`/movies/${movie._id}`} className="text-blue-600 font-medium">
                      {movie.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No favorites yet.</p>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white border-2 border-gray-400 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">Reviews</h2>
            {profileData.reviews && profileData.reviews.length ? (
              <ul className="space-y-3">
                {profileData.reviews.map((review: any) => (
                  <li key={review._id} className="border-l-4 border-blue-500 pl-3">
                    <div className="font-bold text-gray-900">{review.movie?.title ?? 'Movie'}</div>
                    <div className="text-gray-700 mt-1">{review.comment}</div>
                    <div className="text-gray-600 mt-1">Rating: {review.rating}/5</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
