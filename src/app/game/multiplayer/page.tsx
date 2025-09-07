"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export default function Game() {
  const [gameState, setGameState] = useState<any>({ players: {} });

  useEffect(() => {
    socket = io("http://localhost:8000", {
      withCredentials: true, // optional
    });

    // socket = io("http://localhost:8000"); // WS serveris

    socket.on("gameState", (state: any) => {
      setGameState(state);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const movePlayer = (x: number, y: number) => {
    socket.emit("updatePlayer", { x, y });
  };

  return (
    <div>
      {Object.entries(gameState.players).map(([id, player]: any) => (
        <div key={id}>
          <p>Player {id}</p>
          <p>Car: {player.equippedCar || "none"}</p>
          <p>
            Position: {player.x}, {player.y}
          </p>
        </div>
      ))}

      <button
        onClick={() => movePlayer(Math.random() * 100, Math.random() * 100)}
      >
        Move Randomly
      </button>
    </div>
  );
}
