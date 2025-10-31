"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiCode,
  FiUsers,
  FiZap,
  FiLock,
  FiGithub,
  FiExternalLink,
  FiLinkedin,
} from "react-icons/fi";
import { getAuthenticatedUser, logoutUser } from "@/utils/auth";
import UserSessions from "./(components)/UserSessions";
import type { RoomData } from "@/utils/room";
import { db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

const Page = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [username, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<RoomData[]>([]);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const checkAuth = async () => {
      setPageLoading(true);
      const userLoggedIn = await getAuthenticatedUser();
      if (userLoggedIn.isAuthenticated) {
        setUserName(userLoggedIn?.userData?.username || "user");
      }
      setPageLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!username) return;
      setLoading(true);
      try {
        const usersCollection = collection(db, "users");
        const userQuery = query(
          usersCollection,
          where("username", "==", username)
        );
        const data = await getDocs(userQuery);

        if (data.empty) {
          toast.error("No user found");
          setLoading(false);
          return;
        }

        const userDoc = data.docs[0];
        const userData = userDoc.data();
        const rooms = userData.rooms;
        const roomPromises = rooms.map(async (roomId: string) => {
          const roomsCollections = collection(db, "rooms");
          const roomQuery = query(
            roomsCollections,
            where("roomId", "==", roomId)
          );
          const roomData = await getDocs(roomQuery);
          if (!roomData.empty) {
            const roomDoc = roomData.docs[0];
            const roomDetails = roomDoc.data() as RoomData;
            return {
              roomId: roomDoc.id,
              code: roomDetails.code,
              language: roomDetails.language,
            };
          }
        });
        const resolvedRooms = await Promise.all(roomPromises);
        const filteredRoomData = resolvedRooms.filter(
          (room) => room !== null && room!==undefined
        ) as RoomData[];
        setSessions(filteredRoomData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [username]);

  return pageLoading ? (
    /* Loading Overlay */
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-blue-400 border-opacity-20 rounded-full animate-spin"></div>
        {/* Inner spinner */}
        <div
          className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"
          style={{ animationDuration: "0.8s" }}
        ></div>

        {/* Optional loading text */}
        <div className="mt-4 text-center text-blue-400 text-sm font-medium">
          Loading...
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-gray-900 shadow-md" : "bg-gray-900/90 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Code Collab"
                className="h-9 w-9 rounded-full"
              />
              <span className="ml-2 text-xl font-bold">Code Collab</span>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-6">
              {username ? (
                <>
                  <span className="text-gray-300">Welcome, {username}</span>
                  <button
                    onClick={async () => {
                      const success = await logoutUser();
                      if (success) {
                        setUserName("");
                        router.push("/Auth/login");
                      }
                    }}
                    className="text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/Auth/login"
                    className="text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/Auth/signUp"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
            <div className="md:hidden">
              <button className="text-gray-300 hover:text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                <span className="block">Collaborative Code</span>
                <span className="block text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                  Without Barriers
                </span>
              </h1>
              <p className="mt-4 text-base text-gray-300 sm:mt-5 sm:text-lg leading-relaxed">
                Code Collab makes real-time collaboration effortless. Edit code
                together, execute it instantly, and receive smart AI suggestions
                – all in one secure, professional environment.
              </p>
              <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <button
                    onClick={() => router.push("/create-room")}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-lg transition-all md:py-4 md:text-lg md:px-10"
                  >
                    Start Collaborating
                  </button>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="#features"
                    className="w-full flex items-center justify-center px-8 py-3 border border-gray-700 text-base font-medium rounded-md text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors md:py-4 md:text-lg md:px-10"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 transition-all hover:shadow-2xl">
                <div className="bg-gray-700 px-4 py-2 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="mx-auto text-sm text-gray-300 flex items-center">
                    <FiCode className="mr-2" />{" "}
                    <span>collaborative-editor.js</span>
                  </div>
                </div>
                <div className="relative p-4 bg-gray-900 font-mono">
                  <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col text-right pr-2 text-gray-500 text-sm pt-4 select-none border-r border-gray-700">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                    <div>6</div>
                    <div>7</div>
                  </div>
                  <pre className="text-sm overflow-x-auto pl-10">
                    <code>
                      <span className="text-purple-400">function</span>{" "}
                      <span className="text-yellow-300">greet</span>
                      <span className="text-white">(</span>
                      <span className="text-orange-300">name</span>
                      <span className="text-white">)</span>{" "}
                      <span className="text-white">{"{"}</span>
                      <br /> <span className="text-purple-400">
                        return
                      </span>{" "}
                      <span className="text-green-300">"Hello, "</span>{" "}
                      <span className="text-blue-300">+</span>{" "}
                      <span className="text-orange-300">name</span>{" "}
                      <span className="text-blue-300">+</span>{" "}
                      <span className="text-green-300">"!"</span>
                      <span className="text-white">;</span>
                      <br />
                      <span className="text-white">{"}"}</span>
                      <br />
                      <br />
                      <span className="text-gray-500">
                        // Try calling the function
                      </span>
                      <br />
                      <span className="text-cyan-300">console</span>
                      <span className="text-white">.</span>
                      <span className="text-yellow-300">log</span>
                      <span className="text-white">(</span>
                      <span className="text-yellow-300">greet</span>
                      <span className="text-white">(</span>
                      <span className="text-green-300">"Coder"</span>
                      <span className="text-white">));</span>
                      <br />
                      <span className="text-gray-400 animate-pulse">|</span>
                    </code>
                  </pre>
                </div>
                <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 flex justify-between items-center border-t border-gray-700">
                  <div>Multiple users editing • Real-time collaboration</div>
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-b from-gray-800 to-gray-900"
      >
        {username && (
          <section className="py-16 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Your Coding Sessions</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Continue working on your previous projects or start a new one
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
              </div>
            ) : (
              <UserSessions sessions={sessions} username={username} />
            )}
          </section>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              <span className="block text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                Powerful Features
              </span>
              <span className="block text-white mt-2">
                for Modern Collaboration
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-300 mx-auto">
              Everything you need to code together, solve problems, and build
              amazing projects.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-800 rounded-lg p-8 shadow-md hover:shadow-lg transition-all border border-gray-700">
              <div className="bg-blue-600 bg-opacity-20 p-3 rounded-2xl inline-block mb-4">
                <FiCode className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Real-time Collaboration
              </h3>
              <p className="text-gray-300 mb-4">
                See everyone's changes instantly and code together as if you're
                in the same room. Perfect for pair programming and code reviews.
              </p>
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
              >
                Learn more <FiExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 shadow-md hover:shadow-lg transition-all border border-gray-700">
              <div className="bg-blue-600 bg-opacity-20 p-3 rounded-2xl inline-block mb-4">
                <FiZap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Code Execution</h3>
              <p className="text-gray-300 mb-4">
                Run your code directly in the browser with support for 13+
                programming languages, with real-time output sharing.
              </p>
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
              >
                Learn more <FiExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 shadow-md hover:shadow-lg transition-all border border-gray-700">
              <div className="bg-blue-600 bg-opacity-20 p-3 rounded-2xl inline-block mb-4">
                <FiUsers className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Communication</h3>
              <p className="text-gray-300 mb-4">
                Built-in chat, cursor tracking, and user presence indicators
                make collaboration smooth and efficient.
              </p>
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
              >
                Learn more <FiExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 shadow-md hover:shadow-lg transition-all border border-gray-700">
              <div className="bg-blue-600 bg-opacity-20 p-3 rounded-2xl inline-block mb-4">
                <FiLock className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Code Assistant</h3>
              <p className="text-gray-300 mb-4">
                Get intelligent code suggestions, explanations, and help from
                our integrated AI assistant – like pair programming with an
                expert.
              </p>
              <a
                href="#"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
              >
                Learn more <FiExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!username && (
        <section className="py-16 bg-gradient-to-r from-blue-800 to-blue-600">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-6">
              Ready to start coding together?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => router.push("/create-room")}
                className="px-8 py-3 bg-white text-blue-800 rounded-md text-lg font-medium hover:bg-gray-100 transition-colors shadow-md"
              >
                Create a Room
              </button>
              <Link
                href="/Auth/signUp"
                className="px-8 py-3 bg-blue-900 text-white border border-blue-300 rounded-md text-lg font-medium hover:bg-blue-800 transition-colors shadow-md"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full overflow-hidden shadow-lg ring-2 ring-blue-500 p-0.5 bg-gradient-to-r from-blue-500 to-blue-700">
                  <img
                    src="/logo.png"
                    alt="Code Collab"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Code Collab
                </span>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Collaborative coding made simple, powerful, and accessible for
                teams of all sizes. Join thousands of developers who code
                better, together.
              </p>
              <div className="mt-6 flex space-x-3">
                <a
                  href="https://github.com/HarshilGandhi7"
                  className="transition-all duration-200 h-9 w-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white hover:shadow-lg"
                  aria-label="GitHub Profile"
                >
                  <FiGithub className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/harshilgandhi77/"
                  className="transition-all duration-200 h-9 w-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white hover:shadow-lg"
                  aria-label="LinkedIn Profile"
                >
                  <FiLinkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center text-gray-400">
              <span>
                © {new Date().getFullYear()} Code Collab. All rights reserved.
              </span>
              <span className="inline-flex items-center px-2 py-0.5 ml-3 rounded text-xs font-medium bg-blue-900 text-blue-200">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Add styles for gradient text */}
      <style jsx global>{`
        .text-gradient {
          background-size: 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -moz-background-clip: text;
          -webkit-text-fill-color: transparent;
          -moz-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Page;
