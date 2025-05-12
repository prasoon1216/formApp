import React, { useState, useRef } from 'react';
import AlliedLogo from '../assets/images/AlliedLogo.jpg';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Get stored usernames from localStorage
  const getStoredUsernames = () => {
    try {
      return JSON.parse(localStorage.getItem('usernames') || '[]');
    } catch {
      return [];
    }
  };
  const [usernames, setUsernames] = useState(getStoredUsernames());

  // Filter suggestions based on input
  const filteredSuggestions = username
    ? usernames.filter(u => u.toLowerCase().includes(username.toLowerCase()))
    : [];

  // Store username after successful login
  const storeUsername = (uname) => {
    let updated = [...new Set([uname, ...getStoredUsernames()])];
    localStorage.setItem('usernames', JSON.stringify(updated));
    setUsernames(updated);
  };

  // Handle click outside suggestions
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/auth/login', { username, password });
      if (res.data && res.data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        storeUsername(username);
        if (setIsLoggedIn) setIsLoggedIn(true);
        navigate('/home');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setUsername(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (uname) => {
    setUsername(uname);
    setShowSuggestions(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-blue-400">
      {/* Glassmorphic Login Container */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-2xl p-8 rounded-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={AlliedLogo} alt="Allied Medical" className="h-20 w-auto object-contain rounded bg-white p-2 shadow" style={{maxWidth: '120px'}} />
        </div>

        {/* Login Heading */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

        {error && <div className="text-red-600 text-center mb-2 font-semibold">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
              placeholder="Enter your username"
              required
              autoFocus
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredSuggestions.map((uname, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                    onClick={() => handleSuggestionClick(uname)}
                  >
                    {uname}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <a href="#" className="text-blue-600 text-sm font-semibold hover:underline focus:underline focus:outline-none">Forgot Password?</a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg shadow-md hover:bg-blue-700 focus:bg-blue-800 transition duration-300 font-semibold text-lg"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
