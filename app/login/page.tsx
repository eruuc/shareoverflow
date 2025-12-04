"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from "../AuthProvider";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const userData = res.data;
      
      // Verify we got a valid _id
      if (!userData._id) {
        setError('Login failed: No user ID returned');
        return;
      }
      
      console.log('Login successful, user data:', userData);
      
      login(userData.email, userData.roles, userData.role, userData._id);
      // Also store viewerId for profile page
      if (typeof window !== 'undefined') {
        localStorage.setItem('viewerId', userData._id);
        // Clear any old cached data
        localStorage.removeItem('shareoverflow/user');
        localStorage.setItem('shareoverflow/user', JSON.stringify({
          email: userData.email,
          loggedIn: true,
          roles: userData.roles,
          role: userData.role,
          _id: userData._id
        }));
      }
      setLoggedIn(true);
      setError('');
      
      // Redirect to profile after successful login
      setTimeout(() => {
        window.location.href = '/profile';
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-200 px-4">
      <div className="bg-white border-2 border-gray-400 rounded-lg p-10 w-full max-w-md shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 text-center">Login</h1>
        {loggedIn ? (
          <div className="p-4 bg-green-200 border-2 border-green-500 text-green-900 rounded text-center font-medium">
            You are now logged in. Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-gray-900 font-bold mb-2 text-lg">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-400 rounded px-4 py-3 text-lg text-gray-900 focus:border-blue-600 focus:outline-none bg-white"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-gray-900 font-bold mb-2 text-lg">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-400 rounded px-4 py-3 text-lg text-gray-900 focus:border-blue-600 focus:outline-none bg-white"
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-red-200 border-2 border-red-500 text-red-900 rounded text-center font-bold">
                {error}
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded text-lg font-bold hover:bg-blue-700 border-2 border-blue-700"
            >
              Login
            </button>
            <p className="text-center text-gray-800">
              Don't have an account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Register</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
};

export default Login;
