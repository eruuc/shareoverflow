"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../AuthProvider";

export default function ProfileDetailPage() {
  const { profileId } = useParams();
  const { user } = useAuth();
  const viewerId = user?._id;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      // Pass viewerId if available (for privacy - to show email/phone if viewing own profile)
      const viewerIdParam = viewerId ? `?viewerId=${viewerId}` : "";
      const res = await axios.get(`/api/users/${profileId}${viewerIdParam}`);
      setProfile(res.data);
      setLoading(false);
    }
    if (profileId) loadProfile();
  }, [profileId, viewerId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!profile) return <div className="p-8 text-red-500">User Not Found</div>;

  const isOwner = viewerId === profile._id;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{profile.username}&apos;s Profile</h1>
          <Link href="/" className="underline text-blue-700">Home</Link>
          {isOwner && <Link href="/profile/edit" className="ml-4 bg-blue-600 text-white font-medium py-1 px-4 rounded hover:bg-blue-700">Edit Profile</Link>}
        </div>

        {/* Personal Info */}
        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Personal Information</h2>
          <div><strong>Username:</strong> {profile.username}</div>
          {isOwner ? (
            <>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Phone:</strong> {profile.phone || <em>(not set)</em>}</div>
            </>
          ) : null}
          <div><strong>Role:</strong> {profile.role}</div>
        </section>

        {/* Following */}
        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Following</h2>
          {profile.following && profile.following.length ? (
            <ul>
              {profile.following.map((user: any) => (
                <li key={user._id}>
                  <Link href={`/profile/${user._id}`} className="underline">{user.username}</Link>
                </li>
              ))}
            </ul>
          ) : <span className="text-gray-500">Not following anyone.</span>}
        </section>

        {/* Followers */}
        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Followers</h2>
          {profile.followers && profile.followers.length ? (
            <ul>
              {profile.followers.map((user: any) => (
                <li key={user._id}>
                  <Link href={`/profile/${user._id}`} className="underline">{user.username}</Link>
                </li>
              ))}
            </ul>
          ) : <span className="text-gray-500">No followers yet.</span>}
        </section>

        {/* Favorites */}
        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Favorites</h2>
          {profile.favorites && profile.favorites.length ? (
            <ul>
              {profile.favorites.map((movie: any) => (
                <li key={movie._id}>
                  <Link href={`/movies/${movie._id}`} className="underline">{movie.title}</Link>
                </li>
              ))}
            </ul>
          ) : <span className="text-gray-500">No favorites yet.</span>}
        </section>

        {/* Reviews */}
        <section className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Reviews</h2>
          {profile.reviews && profile.reviews.length ? (
            <ul>
              {profile.reviews.map((review: any) => (
                <li key={review._id}>
                  <b>{review.movie?.title ?? 'Movie'}:</b> {review.comment} (Rated: {review.rating})
                </li>
              ))}
            </ul>
          ) : <span className="text-gray-500">No reviews yet.</span>}
        </section>
      </div>
    </main>
  );
}
