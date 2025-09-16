"use client";
import { useEffect, useState } from "react";
import { loadStats, saveStats } from "../functions";
import Link from "next/link";

export default function UpgradePage() {
  const [stats, setStats] = useState({
    damage: 1,
    fireDelay: 1000,
    playerSpeed: 3.5,
    playerHealth: 100,
    score: 0,
  });

  // Load stats from localStorage on the client
  useEffect(() => {
    const stored = loadStats();
    setStats(stored);
  }, []);

  // Save whenever stats change
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  function upgrade(
    type: "damage" | "fireDelay" | "playerSpeed" | "playerHealth"
  ) {
    const cost = 10; // or dynamic cost
    if (stats.score < cost) return;

    setStats((prev: any) => {
      const newStats = { ...prev, score: prev.score - cost };
      switch (type) {
        case "damage":
          newStats.damage += 0.1;
          break;
        case "fireDelay":
          newStats.fireDelay = Math.max(50, newStats.fireDelay - 100);
          break;
        case "playerSpeed":
          newStats.playerSpeed += 0.05;
          break;
        case "playerHealth":
          newStats.playerHealth += 1;
          break;
      }
      return newStats;
    });
  }

  return (
    <div className="p-4 space-y-4">
      <Link href="/game3" className="text-blue-600 underline">
        Back to Game
      </Link>
      <h1 className="text-2xl font-bold">
        Upgrades {"(Each upgrade cost 10 coins)"}
      </h1>
      <div>Coins: {stats.score}</div>

      {["damage", "fireDelay", "playerSpeed", "playerHealth"].map((type) => {
        const key = type as keyof typeof stats; // <-- cast here
        return (
          <div
            key={type}
            className="flex justify-between items-center max-w-xs"
          >
            <span>
              {type.charAt(0).toUpperCase() + type.slice(1)}: {stats[key]}
            </span>
            <button
              onClick={() => upgrade(key as any)} // <-- cast here
              className="bg-blue-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-blue-700 disabled:opacity-50"
            >
              Upgrade
            </button>
          </div>
        );
      })}

      <div className="absolute text-sm text-gray-600">
        Note: Upgrades take effect in the next game session.
      </div>
    </div>
  );
}
