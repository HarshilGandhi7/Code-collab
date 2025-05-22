"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthenticatedUser } from "@/utils/auth";

function generateRoomId() {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
}

const Page = () => {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  React.useEffect(() => {
    const checkAuth = async () => {
      const userLoggedIn = await getAuthenticatedUser();
      if (!userLoggedIn.isAuthenticated) {
        router.push("Auth/login");
      } else {
        setUsername(userLoggedIn?.userData?.username || "");
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRoomId = roomId.trim() || generateRoomId();
    router.push(`/room/${finalRoomId}/${username}`);
  };

  const handleGenerateRoomId = () => {
    setRoomId(generateRoomId());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-white">
              Join Code Collaboration
            </h1>
            <img
              src="/logo.png"
              alt="Code Collab Logo"
              className="w-8 h-8 object-contain rounded-3xl"
            />
          </div>
          <p className="text-gray-400 text-sm">
            Create or join a collaborative coding session
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Room ID
            </label>
            <div className="flex">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID or leave blank"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGenerateRoomId}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Generate
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default Page;
