"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-config";
import { collection, onSnapshot } from "firebase/firestore";
import { useQRCode } from "next-qrcode";

function Events() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { Canvas } = useQRCode();

  // Function to determine background color based on house name
  const getHouseBackground = (place) => {
    if (!place) return "from-gray-400 to-gray-600";
    const houseName = place.split(" - ")[1] || "";
    const lowerHouse = houseName.toLowerCase();
    if (lowerHouse.includes("red")) return "from-red-500 to-red-700";
    if (lowerHouse.includes("blue")) return "from-blue-500 to-blue-700";
    if (lowerHouse.includes("green")) return "from-green-500 to-green-700";
    if (lowerHouse.includes("yellow")) return "from-yellow-500 to-yellow-700";
    return "from-gray-400 to-gray-600"; // Default fallback
  };

  // Fetch data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "events"),
      (querySnapshot) => {
        const eventsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        setError("Failed to fetch events. Please try again.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-slide
  useEffect(() => {
    if (isPaused || events.length === 0 || isLoading) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === events.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, events.length, isLoading]);

  // Scroll slider
  useEffect(() => {
    if (sliderRef.current && events.length > 0 && !isLoading) {
      sliderRef.current.scrollTo({
        left: currentIndex * sliderRef.current.offsetWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, events.length, isLoading]);

  const handlePrev = () => {
    setIsPaused(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? events.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setIsPaused(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === events.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPassword = "swaralaya@2025";
    if (password === correctPassword) {
      localStorage.setItem("authToken", "authenticated");
      router.push(`/${correctPassword}`);
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div
      className="relative w-full h-full bg-gradient-to-br from-indigo-900 to-blue-950 text-white overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={sliderRef}
        className="flex w-full lg:h-full snap-x snap-mandatory overflow-x-hidden scrollbar-hide"
      >
        {isLoading ? (
          <div className="min-w-full h-full snap-center flex items-center justify-center p-4 sm:p-8 bg-indigo-800/50">
            <div className="flex items-center gap-4 animate-pulse">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg sm:text-xl">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="min-w-full h-full snap-center flex items-center justify-center p-4 sm:p-8 bg-indigo-800/50">
            <p className="text-lg sm:text-xl">No events available</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              className="min-w-full h-full snap-center flex items-center justify-center p-4 sm:p-6 md:p-8 transition-all duration-500"
              style={{
                transform: `scale(${currentIndex === index ? 1 : 0.95})`,
                opacity: currentIndex === index ? 1 : 0.7,
              }}
            >
              <div className="relative max-w-4xl h-full w-full p-4 sm:p-8 bg-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-start">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 sm:mb-8 pb-4 text-center text-white">
                  {event.name}
                </h2>
                <div className="w-full max-w-lg space-y-4">
                  <div className="flex border-b border-white/20">
                    <div className="py-2 px-3 sm:py-3 sm:px-6 font-semibold text-xl sm:text-2xl md:text-3xl text-white/80 w-1/3">
                      Category
                    </div>
                    <div className="py-2 px-3 sm:py-3 sm:px-6 text-white text-2xl sm:text-3xl md:text-4xl">
                      {event.category}
                    </div>
                  </div>
                  {event.completed ? (
                    <div className="flex flex-col items-center gap-4 sm:gap-6 mt-6 sm:mt-8 max-w-md mx-auto">
                      {event.winner && (
                        <div className={`relative w-full bg-gradient-to-r ${getHouseBackground(event.winner)} rounded-lg p-4 sm:p-6 shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-300 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            </div>
                            <div>
                              <p className="text-lg sm:text-2xl font-extrabold text-white">
                                {event.winner}
                              </p>
                              <p className="text-base sm:text-lg font-semibold text-yellow-200">
                                1st Place
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {event.second && (
                        <div className={`relative w-11/12 bg-gradient-to-r ${getHouseBackground(event.second)} rounded-lg p-3 sm:p-5 shadow-lg transform hover:scale-105 transition-all duration-300`}>
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            </div>
                            <div>
                              <p className="text-base sm:text-xl font-bold text-white">
                                {event.second}
                              </p>
                              <p className="text-sm sm:text-md font-semibold text-gray-200">
                                2nd Place
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {event.third && (
                        <div className={`relative w-10/12 bg-gradient-to-r ${getHouseBackground(event.third)} rounded-lg p-2 sm:p-4 shadow-lg transform hover:scale-105 transition-all duration-300`}>
                          <div className="flex items-center gap-4">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-300 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            </div>
                            <div>
                              <p className="text-md sm:text-lg font-bold text-white">
                                {event.third}
                              </p>
                              <p className="text-xs sm:text-sm font-semibold text-amber-200">
                                3rd Place
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex border-b border-white/20">
                        <div className="py-2 px-3 sm:py-3 sm:px-6 font-semibold text-xl sm:text-2xl md:text-3xl text-white/80 w-1/3">
                          Time
                        </div>
                        <div className="py-2 px-3 sm:py-3 sm:px-6 text-white text-xl sm:text-2xl md:text-3xl">
                          {event.time}
                        </div>
                      </div>
                      <div className="flex">
                        <div className="py-2 px-3 sm:py-3 sm:px-6 font-semibold text-xl sm:text-2xl md:text-3xl text-white/80 w-1/3">
                          Venue
                        </div>
                        <div className="py-2 px-3 sm:py-3 sm:px-6 text-xl sm:text-2xl md:text-3xl text-white">
                          {event.venue}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center w-full">
        <img
          src="/side1.jpeg"
          alt="Swaralaya Event Art"
          className="lg:hidden absolute w-3/4 rounded-2xl bottom-2 h-1/2"
        />
      </div>

      <div className="absolute bottom-10 right-1 lg:bottom-10 lg:right-4 flex items-center gap-4 ">
        <div className="hidden lg:block">
          <Canvas
            text={"https://scoreboard.vercel.app/"}
            options={{
              errorCorrectionLevel: "M",
              margin: 3,
              scale: 4,
              width: 100,
              color: {
                dark: "#010599FF",
                light: "#FFBF60FF",
              },
            }}
          />
        </div>

        <button
          onClick={() => setShowPopup(true)}
          className="text-2xl text-amber-300 hover:text-amber-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </button>
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-2 sm:p-4 rounded-full hover:bg-white/20 transition-all duration-300"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md text-white p-2 sm:p-4 rounded-full hover:bg-white/20 transition-all duration-300"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center py-2 space-x-3">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsPaused(true);
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentIndex === index
                ? "bg-amber-400 scale-125"
                : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <h3 className="text-xl sm:text-2xl font-bold mb-6 text-white">
              Enter Admin Password
            </h3>
            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-white/30 bg-white/10 text-white p-3 rounded-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                placeholder="Enter password"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;