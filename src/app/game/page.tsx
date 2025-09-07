"use client";

import { useRef, useEffect, useState } from "react";
import { Plane } from "@/components/Plane";
import { Obstacle } from "@/components/Obstacle";
import drawScrollingBackground from "@/tools/imageResize";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  //   const [isRunning, setIsRunning] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  // let score = 0;

  const obstacleMaxShift = 200;

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const storedItems = localStorage.getItem("inventory");
    let car = null;
    if (storedItems) {
      const inventory = JSON.parse(storedItems);
      car = inventory.find((item: any) => item.isEquipped);
    }

    const roadImg = new Image();
    roadImg.src = "/images/road.png";
    // roadImg.src = car ? car.imageUrl : "/images/road.png";

    let roadPattern: CanvasPattern | null = null;
    let offsetY = 0;

    roadImg.onload = () => {
      // roadPattern = ctx.createPattern(roadImg, "repeat-y");
    };

    function drawBackground(
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number
    ) {
      if (!roadPattern) return;

      offsetY += 3; // greitis – kiek pikselių kelias juda žemyn

      // kad pattern „nepasimestų“ naudojam translate
      ctx.save();
      ctx.translate(0, offsetY % roadImg.height); // modulo kad offset niekada neperaugtų
      ctx.fillStyle = roadPattern;
      ctx.fillRect(
        0,
        -roadImg.height,
        canvasWidth,
        canvasHeight + roadImg.height
      );
      ctx.restore();
    }

    const planeImg = new Image();
    // planeImg.src = "/images/car.png";
    planeImg.src = car ? car.imageUrl : "/images/road.png";

    const obstacleImg = new Image();
    obstacleImg.src = "/images/wall.png";
    let obstaclePattern: CanvasPattern | null = null;

    console.log("obstacleImg", obstacleImg);
    console.log("ctx", ctx);

    const plane = new Plane(planeImg, {
      x: canvas.width / 2 - 16,
      y: canvas.height - 200,
      width: 32,
      height: 32,
    });

    const obstacleSpacing = canvas.height / 2 + canvas.width / 6;

    let obstacles: Obstacle[] = [];

    obstacleImg.onload = () => {
      obstaclePattern = ctx.createPattern(obstacleImg, "repeat")!;
      // dabar pattern tikrai galioja
      console.log("obstaclePattern", obstaclePattern);
      const initialCount = 3;
      for (let i = 0; i < initialCount; i++) {
        obstacles.push(
          new Obstacle(obstaclePattern, obstacleImg, -i * 800, canvas.width)
        );
      }
    };
    // const obstaclePattern = ctx.createPattern(obstacleImg, "repeat");

    const keys: Record<string, boolean> = {};
    // window.addEventListener("keydown", (e) => (keys[e.key] = true));
    // window.addEventListener("keyup", (e) => (keys[e.key] = false));

    // let direction: "left" | "right" | "none" = "none";

    // // Paspaudus klavišą pakeičiam kryptį
    // window.addEventListener("keydown", (e) => {
    //   if (e.key === "ArrowLeft") direction = "left";
    //   if (e.key === "ArrowRight") direction = "right";
    // });

    let direction: "left" | "right" | "none" = "right";

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") direction = "left";
      if (e.key === "ArrowRight") direction = "right";
    });

    window.addEventListener("click", toggleDirection);
    // window.addEventListener("touchstart", toggleDirection);

    function toggleDirection() {
      if (direction === "left") direction = "right";
      else if (direction === "right") direction = "left";
      else direction = "right";
    }

    let isRunning = true;

    let speed = canvas.width > 600 ? 4 : 2;

    function draw() {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // drawBackground(ctx, canvas.width, canvas.height);
      drawScrollingBackground(ctx, roadImg, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // 0.3 = 30% darkness
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Plane movement
      speed += 0.0001;
      if (direction == "left")
        plane.move(-speed, 0, canvas.width, canvas.height);
      if (direction == "right")
        plane.move(speed, 0, canvas.width, canvas.height);

      // console.log("new direction", direction);
      plane.draw(ctx, direction);

      // Obstacles
      obstacles.forEach((obs, index) => {
        obs.draw(ctx, canvas.width);
        obs.update();

        if (obs.collides(plane.plane)) {
          console.log("Collision!");

          // Skaitymas
          let money = parseInt(localStorage.getItem("money") || "0");

          // Pridedam pinigus
          money += Math.floor(scoreRef.current / 10);

          console.log("money", money);
          console.log("score", scoreRef.current);

          // Išsaugom
          localStorage.setItem("money", money.toString());

          setShowGameOver(true);

          isRunning = false;
        }

        // if (obs.isOffScreen(canvas.height)) {
        //   obstacles.splice(index, 1);
        //   obstacles.push(new Obstacle(-20, canvas.width));
        // }

        if (obs.isOffScreen(canvas.height)) {
          // surandam aukščiausiai esančios obstacle Y
          const highestY = Math.min(...obstacles.map((o) => o.obstacle.y));

          // naują dedam dar aukščiau su spacing
          obs.obstacle.y = highestY - obstacleSpacing;
          obs.obstacle.gapStart =
            Math.random() * (canvas.width - obs.obstacle.gapHeight - 40) + 20;
        }

        if (plane.plane.y + plane.plane.height < obs.obstacle.y) {
          setScore((prev) => {
            scoreRef.current = prev + 1; // atnaujinam ref
            return prev + 1;
          });
          // setScore((s) => s + 1);
          // score += 1; // arba ++passedObstacles
        }
      });

      //   requestAnimationFrame(draw);
      if (isRunning) requestAnimationFrame(draw);
    }

    planeImg.onload = () => draw();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="absolute w-full z-10" />
      <h3 className="absolute z-50 px-4 py-1 text-white">score: {score}</h3>
      {showGameOver && (
        <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-8 py-6 rounded-lg text-center">
          <h2 className="text-2xl mb-4">Game Over</h2>
          <p className="mb-4">Your score: {score}</p>
          <p className="mb-4">
            Your money: {parseInt(localStorage.getItem("money") || "0")}
          </p>
          <div className="flex flex-col gap-1">
            <button
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => location.reload()}
            >
              Restart Game
            </button>
            <button
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => (window.location.href = "/garage")}
            >
              Go to Garage
            </button>
            <button
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => (window.location.href = "/")}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
