"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from "../AuthProvider";

const Register = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [roles, setRoles] = useState<{ user: boolean; admin: boolean }>({ user: false, admin: false });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { login } = useAuth();

  const handleRoleChange = (role: 'user' | 'admin') => {
    if (role === 'admin') return; // can't select admin at registration
    setRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !username) {
      setError('All fields are required.');
      return;
    }

    try {
      const res = await axios.post('/api/auth/register', {
        email,
        password,
        username,
        role: 'RegularUser'
      });
      
      const userData = res.data;
      login(userData.email, userData.roles, userData.role, userData._id);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('viewerId', userData._id);
        localStorage.setItem('shareoverflow/user', JSON.stringify({
          email: userData.email,
          loggedIn: true,
          roles: userData.roles,
          role: userData.role,
          _id: userData._id
        }));
      }
      
      setSubmitted(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-200 px-4">
      <div className="bg-white border-2 border-gray-400 rounded-lg p-10 w-full max-w-md shadow-lg">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 text-center">Register</h1>
        {submitted ? (
          <div className="p-4 bg-green-200 border-2 border-green-500 text-green-900 rounded text-center font-medium">
            Registration Successful! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-gray-900 font-bold mb-2 text-lg">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-2 border-gray-400 rounded px-4 py-3 text-lg text-gray-900 focus:border-blue-600 focus:outline-none"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-gray-900 font-bold mb-2 text-lg">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-400 rounded px-4 py-3 text-lg text-gray-900 focus:border-blue-600 focus:outline-none"
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
                className="w-full border-2 border-gray-400 rounded px-4 py-3 text-lg text-gray-900 focus:border-blue-600 focus:outline-none"
                placeholder="Enter your password"
                required
              />
            </div>
            <div>
              <label className="block text-gray-900 font-bold mb-2 text-lg">Role</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={roles.user}
                    onChange={() => handleRoleChange('user')}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-medium">User</span>
                </label>
                <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={roles.admin}
                    disabled
                    readOnly
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-medium">Admin</span>
                  <span className="text-sm text-gray-600">(assigned by admin)</span>
                </label>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-200 border-2 border-red-500 text-red-900 rounded text-center font-medium">
                {error}
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded text-lg font-bold hover:bg-blue-700 border-2 border-blue-700"
            >
              Register
            </button>
            <p className="text-center text-gray-800">
              Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
};

export default Register;
