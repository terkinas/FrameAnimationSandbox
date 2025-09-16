"use client";
import { useEffect, useRef } from "react";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // <-- tipas
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<{ x: number; y: number; angle: number }>({
    x: 100,
    y: 100,
    angle: 0,
  });
  const rafRef = useRef<number | null>(null);

  const objects = [
    { id: "tree", x: 200, y: 120 },
    { id: "rock", x: 400, y: 300 },
    { id: "chest", x: 600, y: 150 },
    { id: "tree", x: 800, y: 400 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const WIDTH = (canvas.width = 800);
    const HEIGHT = (canvas.height = 600);

    function onKeyDown(e: KeyboardEvent) {
      // stop page from scrolling with arrows
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const speed = 3.5; // pixels per frame

    function frame() {
      const keys = keysRef.current;
      const player = playerRef.current;

      // compute intended direction vector
      let dx = 0;
      let dy = 0;
      if (keys.has("ArrowRight")) dx += 1;
      if (keys.has("ArrowLeft")) dx -= 1;
      if (keys.has("ArrowDown")) dy += 1;
      if (keys.has("ArrowUp")) dy -= 1;

      // normalize so diagonal speed == cardinal speed
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        playerRef.current.x += (dx / len) * speed;
        playerRef.current.y += (dy / len) * speed;

        const targetAngle = Math.atan2(dy, dx);

        // smooth rotate
        player.angle = lerpAngle(player.angle ?? 0, targetAngle, 0.15);
      }

      // camera centers on player
      const cameraX = playerRef.current.x - WIDTH / 2;
      const cameraY = playerRef.current.y - HEIGHT / 2;

      // draw
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // background
      ctx.fillStyle = "lightgreen";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // objects (only draw if inside camera view)
      objects.forEach((obj) => {
        const screenX = obj.x - cameraX;
        const screenY = obj.y - cameraY;
        // quick frustum cull
        if (
          screenX + 40 < 0 ||
          screenX > WIDTH ||
          screenY + 40 < 0 ||
          screenY > HEIGHT
        ) {
          return;
        }
        ctx.fillStyle =
          obj.id === "tree" ? "green" : obj.id === "rock" ? "gray" : "gold";
        ctx.fillRect(screenX, screenY, 40, 40);
      });

      // player drawn at screen center
      const size = 40;
      ctx.save();
      ctx.translate(WIDTH / 2, HEIGHT / 2); // move origin to player
      ctx.rotate(player.angle);
      ctx.fillStyle = "blue";
      ctx.fillRect(-size / 2, -size / 2, size * 1.5, size);
      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(rafRef.current!);
    };
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #222",
          display: "block",
          margin: "10px auto",
        }}
      />
      <div style={{ textAlign: "center" }}>
        <small>
          Hold arrow keys — try Right + Down for southeast (diagonal) movement.
        </small>
      </div>
    </div>
  );
}

function lerpAngle(a: number, b: number, t: number) {
  const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + diff * t;
}
