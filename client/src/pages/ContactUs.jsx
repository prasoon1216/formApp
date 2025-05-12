import React from 'react';
import { Mail, Info, Send } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 py-10 px-2">
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 max-w-lg w-full">
        <div className="flex items-center mb-6">
          <Info className="text-blue-600 mr-3" size={32} />
          <h2 className="text-3xl font-bold text-blue-800">Contact Us</h2>
        </div>
        <p className="mb-4 text-gray-700 text-lg">
          <span className="font-semibold">Allied Medical Production Management Platform</span> is a modern solution for tracking, reporting, and optimizing daily production activities. This project is developed and maintained by <span className="text-blue-700 font-semibold">Allied Medical Limited</span>.
        </p>
        <div className="flex items-center mb-6">
          <Mail className="text-blue-500 mr-2" size={20} />
          <a href="mailto:ABC@alliedmed.co.in" className="text-blue-700 font-semibold hover:underline">ABC@alliedmed.co.in</a>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Your Name</label>
            <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 outline-none" placeholder="Enter your name" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Your Email</label>
            <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 outline-none" placeholder="Enter your email" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Message</label>
            <textarea className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-300 outline-none" rows={3} placeholder="Type your message..." />
          </div>
          <button type="button" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow-md transition duration-200">
            <Send size={18} /> Send Message
          </button>
        </form>
        <div className="mt-6 text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()} Allied Medical Limited. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ContactUs;