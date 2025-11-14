"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase-config";
import { collection, onSnapshot } from "firebase/firestore";

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [allEvents, setAllEvents] = useState([]);
  const scrollContainerRef = useRef(null);
  const isPaused = useRef(false);
  const lastScrollTop = useRef(0);
  const stallCounter = useRef(0);

  // Fixed categories
  const categories = ["I", "II", "III", "IV","V", "C"];
  // Fixed houses
  const houses = ["Ujjain", "Nalanda", "Taxila", "Vikramshila"];

  // Function to get house-specific color classes
  const getHouseColorClass = (house) => {
    switch (house) {
      case "Nalanda":
        return {
          bg: "bg-blue-100",
          headerBg: "bg-blue-500 text-white",
          text: "text-blue-900",
          totalBg: "bg-blue-200",
        };
      case "Taxila":
        return {
          bg: "bg-green-100",
          headerBg: "bg-green-500 text-white",
          text: "text-green-900",
          totalBg: "bg-green-200",
        };
      case "Ujjain":
        return {
          bg: "bg-yellow-100",
          headerBg: "bg-yellow-500 text-gray-900",
          text: "text-yellow-900",
          totalBg: "bg-yellow-200",
        };
      case "Vikramshila":
        return {
          bg: "bg-red-100",
          headerBg: "bg-red-500 text-white",
          text: "text-red-900",
          totalBg: "bg-red-200",
        };
      default:
        return {
          bg: "bg-white",
          headerBg: "bg-gray-500 text-white",
          text: "text-gray-900",
          totalBg: "bg-gray-200",
        };
    }
  };

  // Fetch and process leaderboard data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "leaderboard"),
      (querySnapshot) => {
        const leaderboardList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Initialize house data with all categories
        const houseData = {};
        houses.forEach((house) => {
          houseData[house] = { totalPoints: 0, categories: {} };
          categories.forEach((category) => {
            houseData[house].categories[category] = { events: {}, points: 0 };
          });
        });

        // Collect all unique events
        const uniqueEvents = new Set();
        leaderboardList.forEach((entry) => {
          uniqueEvents.add(entry.item);
        });
        const sortedEvents = Array.from(uniqueEvents).sort();

        // Populate events and points
        leaderboardList.forEach((entry) => {
          const { house, item, category, points } = entry;
          if (houseData[house] && categories.includes(category)) {
            // Initialize event if not present
            if (!houseData[house].categories[category].events[item]) {
              houseData[house].categories[category].events[item] = [];
            }
            // Add points to the event
            houseData[house].categories[category].events[item].push(
              Number(points)
            );
            houseData[house].categories[category].points += Number(points);
            houseData[house].totalPoints += Number(points);
          }
        });

        // Convert to array for leaderboard data
        const leaderboard = houses.map((house) => ({
          house,
          totalPoints: houseData[house].totalPoints,
          categories: houseData[house].categories,
        }));

        setLeaderboardData(leaderboard);
        setAllEvents(sortedEvents);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching leaderboard data:", error);
        setError("Failed to fetch leaderboard data. Please try again.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-scrolling logic
  useEffect(() => {
    if (
      !scrollContainerRef.current ||
      isLoading ||
      error ||
      leaderboardData.length === 0
    )
      return;

    const scrollContainer = scrollContainerRef.current;
    const scrollSpeed = 0.5; // Pixels per frame (~30 pixels/second)
    let scrollDirection = 1; // 1 for down, -1 for up
    let animationFrameId;
    const stallThreshold = 60; // Frames (~1 second at 60fps)

    const scroll = () => {
      if (isPaused.current) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

      // Use a larger tolerance for browser compatibility
      const tolerance = 5; // Pixels
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;
      const isAtTop = scrollTop <= tolerance;

      // Check for scroll stall
      if (Math.abs(scrollTop - lastScrollTop.current) < 0.1) {
        stallCounter.current += 1;
      } else {
        stallCounter.current = 0;
      }
      lastScrollTop.current = scrollTop;

      // Reverse direction at bottom, top, or if stalled
      if (
        isAtBottom ||
        (scrollDirection === 1 && stallCounter.current > stallThreshold)
      ) {
        scrollDirection = -1; // Scroll up
        stallCounter.current = 0;
      } else if (
        isAtTop ||
        (scrollDirection === -1 && stallCounter.current > stallThreshold)
      ) {
        scrollDirection = 1; // Scroll down
        stallCounter.current = 0;
      }

      // Update scroll position
      scrollContainer.scrollTop += scrollDirection * scrollSpeed;

      // Continue animation
      animationFrameId = requestAnimationFrame(scroll);
    };

    // Start animation
    animationFrameId = requestAnimationFrame(scroll);

    // Cleanup on unmount
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLoading, error, leaderboardData]);

  // Handle pause and resume on hover
  const handleMouseEnter = () => {
    isPaused.current = true;
  };

  const handleMouseLeave = () => {
    isPaused.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 text-gray-900 p-2">
      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <div className="flex items-center gap-4 bg-white/80 rounded-lg p-6 shadow-lg backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin"></div>
            <p className="text-lg sm:text-xl font-medium text-indigo-700">
              Loading leaderboard...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center p-10">
          <div className="bg-white/80 rounded-lg p-6 shadow-lg backdrop-blur-sm text-center text-red-600 text-lg sm:text-xl">
            {error}
          </div>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="flex justify-center p-10">
          <div className="bg-white/80 rounded-lg p-6 shadow-lg backdrop-blur-sm text-center text-lg sm:text-xl text-gray-700">
            No leaderboard data available
          </div>
        </div>
      ) : (
        <div className="max-w-screen mx-auto bg-white/50 rounded-xl shadow-2xl overflow-x-auto backdrop-blur-sm">
          <div
            className="relative max-h-[95vh] overflow-y-auto scrollbar-hide"
            ref={scrollContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black sticky top-0 z-40">
                  <th className="py-4 text-center px-6 font-semibold text-lg sm:text-xl text-gray-900 bg-gray-100 border-r border-black sticky left-0 z-50">
                    Event
                  </th>
                  {houses.map((house, houseIndex) => (
                    <th
                      key={house}
                      className={`py-4 text-center px-6 text-white font-semibold text-lg sm:text-xl ${
                        getHouseColorClass(house).headerBg
                      } ${
                        houseIndex < houses.length - 1
                          ? "border-r border-black"
                          : ""
                      }`}
                      colSpan={categories.length}
                    >
                      {house}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-black sticky top-[60px] z-40">
                  <th className="py-3 px-4 font-semibold text-sm sm:text-base text-gray-900 bg-gray-200 border-r border-black sticky left-0 z-50">
                    {/* Empty header for event column */}
                  </th>
                  {houses.map((house, houseIndex) =>
                    categories.map((category, catIndex) => (
                      <th
                        key={`${house}-${category}`}
                        className={`py-3 text-center px-4 font-semibold text-sm sm:text-base ${
                          getHouseColorClass(house).text
                        } ${getHouseColorClass(house).bg} ${
                          houseIndex < houses.length - 1 ||
                          catIndex < categories.length - 1
                            ? "border-r border-black"
                            : ""
                        }`}
                      >
                        {category}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event, eventIndex) => (
                  <tr
                    key={event}
                    className="border-b border-gray-900 hover:bg-gray-50/50 transition-all duration-200"
                  >
                    <td className="py-4 px-4 text-gray-900 text-sm sm:text-base bg-gray-100 border-r border-gray-900 sticky left-0 z-10">
                      {event}
                    </td>
                    {houses.map((house, houseIndex) => {
                      const houseData = leaderboardData.find(
                        (data) => data.house === house
                      ) || {
                        categories: categories.reduce((acc, cat) => {
                          acc[cat] = { events: {} };
                          return acc;
                        }, {}),
                      };
                      return categories.map((category, catIndex) => {
                        const pointsArray =
                          houseData.categories[category].events[event] || [];
                        const displayText =
                          pointsArray.length > 0
                            ? pointsArray.length > 1
                              ? pointsArray.join("+")
                              : `${pointsArray[0]}`
                            : "-";
                        return (
                          <td
                            key={`${house}-${category}-${event}`}
                            className={`py-4 px-4 ${
                              getHouseColorClass(house).text
                            } ${
                              getHouseColorClass(house).bg
                            } text-sm sm:text-base ${
                              houseIndex < houses.length - 1 ||
                              catIndex < categories.length - 1
                                ? "border-r border-gray-900"
                                : ""
                            }`}
                          >
                            {displayText}
                          </td>
                        );
                      });
                    })}
                  </tr>
                ))}
                <tr className="border-t border-gray-900 sticky bottom-0 z-40">
                  <td className="py-4 px-6 text-gray-900 text-lg sm:text-xl font-bold bg-gray-200 border-r border-gray-900 sticky left-0 z-50">
                    Total Points
                  </td>
                  {houses.map((house, index) => {
                    const houseData = leaderboardData.find(
                      (data) => data.house === house
                    ) || {
                      totalPoints: 0,
                    };
                    return (
                      <td
                        key={house}
                        className={`py-4 px-6 ${
                          getHouseColorClass(house).text
                        } ${
                          getHouseColorClass(house).totalBg
                        } text-lg text-center sm:text-xl font-bold ${
                          index < houses.length - 1
                            ? "border-r border-gray-900"
                            : ""
                        }`}
                        colSpan={categories.length}
                      >
                        {houseData.totalPoints}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}

export default Leaderboard;
