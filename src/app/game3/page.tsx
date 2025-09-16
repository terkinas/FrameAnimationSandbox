"use client";
import { use, useEffect, useRef, useState } from "react";
import { loadStats, saveStats } from "./functions";

interface WorldObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  solid: boolean;
}

const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 8000;

const objects = generateObjects();

export default function Game() {
  // IMAGE REFS
  const rockRef = useRef<HTMLImageElement | null>(null);
  const treeRef = useRef<HTMLImageElement | null>(null);
  const tankRef = useRef<HTMLImageElement | null>(null);
  const tankBarrelRef = useRef<HTMLImageElement | null>(null);

  const enemyTankRef = useRef<HTMLImageElement | null>(null);
  const enemyTankShooterRef = useRef<HTMLImageElement | null>(null);
  const enemyTankBarrelRef = useRef<HTMLImageElement | null>(null);

  const [storedScore, setStoredScore] = useState<number | null>(null);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);

  //   const canvasSizeRef = useRef({
  //     width: window.innerWidth,
  //     height: window.innerHeight,
  //   });

  const enemyProjectilesRef = useRef<
    { x: number; y: number; dx: number; dy: number }[]
  >([]);

  const storedStats = loadStats();
  // STATS
  // upgradable stats
  const damageRef = useRef(storedStats?.damage ?? 1);
  const fireDelayRef = useRef(storedStats?.fireDelay ?? 1000);
  const playerSpeedRef = useRef(2.5);
  const playerHealthRef = useRef(storedStats?.playerHealth ?? 100);

  // fixed stats
  const projectileSpeedRef = useRef(8);
  const enemySpeedRef = useRef(1.5);
  const enemyHealthRef = useRef(3);
  const enemyDelayRef = useRef(3000);

  // GAME LOGIC REFS
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const isShootingRef = useRef(false);
  const lastShotRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const playerRef = useRef<{
    x: number;
    y: number;
    angle: number;
    radius: number;
  }>({
    x: 1000,
    y: 1000,
    angle: 0,
    radius: 20,
  });
  //   const playerHealthRef = useRef(100); // <-- PLAYER HEALTH

  const projectilesRef = useRef<
    { x: number; y: number; dx: number; dy: number }[]
  >([]);
  const enemiesRef = useRef<
    {
      x: number;
      y: number;
      health: number;
      lastDamage?: number;
      lastShot: number;
      canShoot: boolean;
    }[]
  >([]);
  const lastEnemySpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);

  function lerpAngle(a: number, b: number, t: number) {
    const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + diff * t;
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const WIDTH = (canvas.width = window.innerWidth);
    const HEIGHT = (canvas.height = window.innerHeight);

    // const VIRTUAL_WIDTH = 1440;
    // const VIRTUAL_HEIGHT = 900;

    // const scaleX = canvas.width / VIRTUAL_WIDTH;
    // const scaleY = canvas.height / VIRTUAL_HEIGHT;

    // const WIDTH = (canvas.width = screen.width);
    // const HEIGHT = (canvas.height = screen.height);

    // const WIDTH = window.innerWidth | (canvas.width = screen.width);
    // const HEIGHT = window.innerHeight | (canvas.height = screen.height);
    // console.log("Canvas size:", WIDTH, HEIGHT);

    // PLAYER HEALTH BAR
    const playerScreenX = WIDTH / 2; // player is always center
    const playerScreenY = HEIGHT / 2;

    const playerBarWidth = 50;
    const playerBarHeight = 6;

    function onKeyDown(e: KeyboardEvent) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          "W",
          "A",
          "S",
          "D",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key);
    }
    function onMouseDown() {
      isShootingRef.current = true;
    }
    function onMouseUp() {
      isShootingRef.current = false;
    }
    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);

    function frame(timestamp: number) {
      const keys = keysRef.current;
      const player = playerRef.current;

      // ---------------- MOVEMENT ----------------
      let dx = 0;
      let dy = 0;
      // Right / D
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
      // Left / A
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
      // Down / S
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
      // Up / W
      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        const moveX = (dx / len) * playerSpeedRef.current;
        const moveY = (dy / len) * playerSpeedRef.current;

        const steps = 4;
        const stepX = moveX / steps;
        const stepY = moveY / steps;

        for (let i = 0; i < steps; i++) {
          let tryX = player.x + stepX;
          let tryY = player.y + stepY;

          // push out for each step
          for (const obj of objects) {
            if (
              obj.solid &&
              circleIntersect(
                tryX,
                tryY,
                player.radius,
                obj.x,
                obj.y,
                obj.radius
              )
            ) {
              const dxOverlap = tryX - obj.x;
              const dyOverlap = tryY - obj.y;
              const dist = Math.hypot(dxOverlap, dyOverlap) || 1;
              const overlap = player.radius + obj.radius - dist;
              tryX += (dxOverlap / dist) * overlap;
              tryY += (dyOverlap / dist) * overlap;
            }
          }

          //   player.x = tryX;
          //   player.y = tryY;
          player.x = tryX;
          player.y = tryY;
          player.x = Math.max(
            player.radius,
            Math.min(WORLD_WIDTH - player.radius, player.x)
          );
          player.y = Math.max(
            player.radius,
            Math.min(WORLD_HEIGHT - player.radius, player.y)
          );
        }

        // rotate player smoothly
        const targetAngle = Math.atan2(dy, dx);
        player.angle = lerpAngle(player.angle, targetAngle, 0.15);
      }

      // ---------------- CAMERA ----------------
      const cameraX = player.x - WIDTH / 2;
      const cameraY = player.y - HEIGHT / 2;

      // let cameraX = player.x - VIRTUAL_WIDTH / 2;
      // let cameraY = player.y - VIRTUAL_HEIGHT / 2;

      // cameraX = Math.max(0, Math.min(cameraX, WORLD_WIDTH - VIRTUAL_WIDTH));
      // cameraY = Math.max(0, Math.min(cameraY, WORLD_HEIGHT - VIRTUAL_HEIGHT));

      // const cameraX = player.x - VIRTUAL_WIDTH / 2;
      // const cameraY = player.y - VIRTUAL_HEIGHT / 2;

      // clamp camera so it stays inside world
      //   cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, cameraX));
      //   cameraY = Math.max(0, Math.min(WORLD_HEIGHT - HEIGHT, cameraY));

      // ---------------- SHOOTING ----------------
      if (
        isShootingRef.current &&
        timestamp - lastShotRef.current > fireDelayRef.current
      ) {
        lastShotRef.current = timestamp;

        const worldMouseX = cameraX + mouseRef.current.x;
        const worldMouseY = cameraY + mouseRef.current.y;

        const dirX = worldMouseX - player.x;
        const dirY = worldMouseY - player.y;
        const len = Math.hypot(dirX, dirY) || 1;
        const ndx = dirX / len;
        const ndy = dirY / len;

        const barrelOffset = 25;
        const spawnX = player.x + ndx * barrelOffset;
        const spawnY = player.y + ndy * barrelOffset;

        projectilesRef.current.push({ x: spawnX, y: spawnY, dx: ndx, dy: ndy });
      }

      // ---------------- ENEMY SPAWN ----------------
      if (timestamp - lastEnemySpawnRef.current > enemyDelayRef.current) {
        lastEnemySpawnRef.current = timestamp;

        // reduce delay after each spawn
        enemyDelayRef.current = Math.max(500, enemyDelayRef.current - 100);
        enemySpeedRef.current = Math.min(2.5, enemySpeedRef.current + 0.01);

        let ex, ey;
        const minDistance = 800; // how far from player enemies must spawn
        let safe = false;

        while (!safe) {
          ex = Math.random() * WORLD_WIDTH;
          ey = Math.random() * WORLD_HEIGHT;

          const dx = ex - player.x;
          const dy = ey - player.y;
          const dist = Math.hypot(dx, dy);

          if (dist > minDistance) {
            safe = true;
          }
        }

        enemiesRef.current.push({
          x: Number(ex),
          y: Number(ey),
          health: enemyHealthRef.current,
          lastShot: 0, // track last time enemy fired
          canShoot:
            (score > 100 && Math.random() > 0.7) ||
            (score > 50 && Math.random() > 0.9) ||
            enemiesRef.current.length == 5, // only first 5 enemies can shoot
        });

        // enemiesRef.current.push({
        //   x: Number(ex),
        //   y: Number(ey),
        //   health: enemyHealthRef.current,
        // });
      }

      enemiesRef.current.forEach((enemy) => {
        moveEnemy(enemy, player, 20);
      });

      // ---------------- ENEMY SHOOTING ----------------
      enemiesRef.current.forEach((enemy) => {
        // Only shoot if they can
        if (enemy.canShoot) {
          const now = performance.now();
          if (!enemy.lastShot || now - enemy.lastShot > 2000) {
            // 2s delay
            enemy.lastShot = now;

            const dirX = player.x - enemy.x;
            const dirY = player.y - enemy.y;
            const len = Math.hypot(dirX, dirY) || 1;
            const ndx = dirX / len;
            const ndy = dirY / len;

            enemyProjectilesRef.current.push({
              x: enemy.x + ndx * 25, // spawn offset
              y: enemy.y + ndy * 25,
              dx: ndx,
              dy: ndy,
            });
          }
        }
      });

      enemyProjectilesRef.current.forEach((p) => {
        p.x += p.dx * 6; // move
        p.y += p.dy * 6;

        // check collision with obstacles
        for (const obj of objects) {
          if (
            obj.solid &&
            circleIntersect(p.x, p.y, 5, obj.x, obj.y, obj.radius) // bullet radius = 5
          ) {
            p.x = Infinity; // mark for removal
            break; // stop checking this bullet
          }
        }
      });

      enemyProjectilesRef.current.forEach((p) => {
        const dist = Math.hypot(p.x - player.x, p.y - player.y);
        if (dist < 20) {
          // hit radius
          playerHealthRef.current -= 1; // damage
          p.x = Infinity; // mark as used
        }
      });

      // remove used projectiles
      enemyProjectilesRef.current = enemyProjectilesRef.current.filter(
        (p) => p.x !== Infinity
      );

      // ---------------- PROJECTILE MOVEMENT + COLLISION ----------------
      projectilesRef.current.forEach((p) => {
        p.x += p.dx * projectileSpeedRef.current;
        p.y += p.dy * projectileSpeedRef.current;

        for (const obj of objects) {
          if (
            obj.solid &&
            circleIntersect(p.x, p.y, 5, obj.x, obj.y, obj.radius)
          ) {
            p.x = Infinity; // mark as used
            break; // no need to check more objects
          }
        }
      });

      // projectile vs enemy collision
      enemiesRef.current.forEach((enemy) => {
        projectilesRef.current.forEach((p) => {
          const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
          if (dist < 25) {
            enemy.health -= damageRef.current;
            p.x = Infinity;
          }
        });
      });

      // remove dead enemies + count score
      const before = enemiesRef.current.length;
      enemiesRef.current = enemiesRef.current.filter((e) => e.health > 0);
      const killed = before - enemiesRef.current.length;
      if (killed > 0) setScore((s) => s + killed);

      // remove used projectiles
      projectilesRef.current = projectilesRef.current.filter(
        (p) => p.x !== Infinity
      );

      // ---------------- PLAYER DAMAGE FROM ENEMIES ----------------
      const now = performance.now();
      enemiesRef.current.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < 40) {
          // touching radius
          if (!enemy.lastDamage || now - enemy.lastDamage >= 1000) {
            playerHealthRef.current -= 10;
            enemy.lastDamage = now;
          }
        }
      });

      // check game over
      if (playerHealthRef.current <= 0) {
        // 1️⃣ load current stats
        const stats = loadStats();

        // 2️⃣ add the score from this game
        stats.score = (stats.score || 0) + score;

        // 3️⃣ save back to localStorage
        saveStats(stats);
        setShowGameOver(true);
        // alert(`Game Over! Score: ${score}`);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }

      // ---------------- DRAW ----------------

      ctx.save();

      // reset transform so clearRect is always real pixels
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // now apply your scale
      // ctx.scale(scaleX, scaleY);
      //   ctx.fillStyle = "lightgreen";
      ctx.fillStyle = "#7cb852ff";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "lightgreen";
      ctx.fillRect(-cameraX, -cameraY, WORLD_WIDTH, WORLD_HEIGHT);

      ctx.strokeStyle = "green";
      // ctx.lineWidth = 1 / scaleX;
      ctx.strokeRect(-cameraX, -cameraY, WORLD_WIDTH, WORLD_HEIGHT);

      //   // objects
      //   objects.forEach((obj) => {
      //     const screenX = obj.x - cameraX;
      //     const screenY = obj.y - cameraY;
      //     ctx.fillStyle =
      //       obj.id === "tree" ? "green" : obj.id === "rock" ? "gray" : "gold";
      //     ctx.fillRect(screenX, screenY, obj.width, obj.height);
      //   });

      // objects as circles
      objects.forEach((obj) => {
        const screenX = obj.x - cameraX;
        const screenY = obj.y - cameraY;

        const collisionOffsetY = 20; // shift circle down by 20 pixels
        const collisionRadius = obj.radius; // e.g., 40

        const circleX = obj.x;
        const circleY = obj.y + collisionOffsetY; // move hitbox down

        const radius = 60; // half of your previous 40x40 rectangle

        // ctx.fillStyle =
        obj.id === "tree" ? "green" : obj.id === "rock" ? "gray" : "gold";

        // ctx.beginPath();
        // ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        let img;
        if (obj.id === "tree") img = treeRef.current;
        if (obj.id === "rock") img = rockRef.current;

        if (img) {
          ctx.drawImage(
            img,
            screenX - obj.radius,
            screenY - obj.radius,
            obj.radius * 2,
            obj.radius * 2
          );
        }

        if (img) {
          //   ctx.drawImage(
          //     img,
          //     screenX - obj.radius,
          //     screenY - obj.radius,
          //     obj.radius * 2,
          //     obj.radius * 2
          //   );
        }
        ctx.fill();
      });

      // projectiles
      projectilesRef.current.forEach((p) => {
        const screenX = p.x - cameraX;
        const screenY = p.y - cameraY;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // enemies
      // enemiesRef.current.forEach((enemy) => {
      //   const screenX = enemy.x - cameraX;
      //   const screenY = enemy.y - cameraY;

      //   const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

      //   // ctx.fillStyle = "purple";
      //   // ctx.fillRect(screenX - 20, screenY - 20, 40, 40);
      //   ctx.save();
      //   // ctx.translate(screenX, screenY);
      //   ctx.translate(-cameraX, -cameraY);
      //   ctx.rotate(angle);
      //   ctx.fillStyle = "purple"; // or draw image instead
      //   ctx.fillRect(-20, -20, 40, 40); // enemy size
      //   if (enemy.canShoot) {
      //     ctx.drawImage(enemyTankShooterRef.current!, -20, -20, 40, 40);
      //     ctx.drawImage(enemyTankBarrelRef.current!, -20, -10 / 2, 25, 10);
      //   } else {
      //     //   ctx.drawImage(enemyTankBarrelRef.current!, -20, -10 / 2, 25, 10);
      //     ctx.drawImage(enemyTankRef.current!, -20, -20, 40, 40);
      //   }

      //   console.log("refs:", enemyTankRef.current);

      //   ctx.restore();

      //   // health bar
      //   ctx.fillStyle = "red";
      //   ctx.fillRect(screenX - 20, screenY - 30, 40, 5);
      //   ctx.fillStyle = "lime";
      //   ctx.fillRect(screenX - 20, screenY - 30, (40 * enemy.health) / 3, 5);
      // });

      enemiesRef.current.forEach((enemy) => {
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;

        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(angle);

        if (enemy.canShoot) {
          if (enemyTankShooterRef.current?.complete) {
            ctx.drawImage(enemyTankShooterRef.current, -20, -20, 40, 40);
          }
          if (enemyTankBarrelRef.current?.complete) {
            ctx.drawImage(enemyTankBarrelRef.current, -20, -5, 25, 10);
          }
        } else {
          if (enemyTankRef.current?.complete) {
            ctx.drawImage(enemyTankRef.current, -20, -20, 40, 40);
          } else {
            ctx.fillStyle = "purple";
            ctx.fillRect(-20, -20, 40, 40);
          }
        }

        ctx.restore();

        //   // health bar
        ctx.fillStyle = "red";
        ctx.fillRect(screenX - 20, screenY - 30, 40, 5);
        ctx.fillStyle = "lime";
        ctx.fillRect(screenX - 20, screenY - 30, (40 * enemy.health) / 3, 5);
      });

      enemyProjectilesRef.current.forEach((p) => {
        const screenX = p.x - cameraX;
        const screenY = p.y - cameraY;
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // PLAYER BODY
      const size = 60;
      ctx.save();
      ctx.translate(WIDTH / 2, HEIGHT / 2);
      ctx.rotate(player.angle);
      ctx.fillStyle = "blue";
      //   ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.drawImage(tankRef.current!, -size / 2, -size / 2, size, size);
      ctx.restore();

      // red background
      ctx.fillStyle = "red";
      ctx.fillRect(
        playerScreenX - playerBarWidth / 2,
        playerScreenY - player.radius - 15, // above player
        playerBarWidth,
        playerBarHeight
      );

      // green current health
      ctx.fillStyle = "lime";
      ctx.fillRect(
        playerScreenX - playerBarWidth / 2,
        playerScreenY - player.radius - 15,
        (playerBarWidth * playerHealthRef.current) / 100, // assuming max health = 100
        playerBarHeight
      );

      // TURRET / GUN BARREL
      ctx.save();
      ctx.translate(WIDTH / 2, HEIGHT / 2);
      const worldMouseX = cameraX + mouseRef.current.x;
      const worldMouseY = cameraY + mouseRef.current.y;
      const turretAngle = Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
      );
      ctx.rotate(turretAngle);
      ctx.fillStyle = "black";
      //   ctx.fillRect(0, -5, 25, 10);
      ctx.drawImage(tankBarrelRef.current!, 0, -10 / 2, 25, 10);
      ctx.restore();

      // HUD Score + Health
      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Health: ${playerHealthRef.current}`, 10, 60);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  useEffect(() => {
    const rockImg = new Image();
    rockImg.src = "/assets/rock1.png";
    rockRef.current = rockImg;

    const treeImg = new Image();
    treeImg.src = "/assets/tree1.png";
    treeRef.current = treeImg;

    const tankImg = new Image();
    tankImg.src = "/assets/tank1.png";
    tankRef.current = tankImg;

    const tankBarrelImg = new Image();
    tankBarrelImg.src = "/assets/barrel1.png";
    tankBarrelRef.current = tankBarrelImg;

    const enemyTankImg = new Image();
    enemyTankImg.src = "/assets/enemy_tank.png";
    enemyTankRef.current = enemyTankImg;

    const enemyTankShooterImg = new Image();
    enemyTankShooterImg.src = "/assets/enemy_tank_shooter.png";
    enemyTankShooterRef.current = enemyTankShooterImg;

    const enemyTankBarrelImg = new Image();
    enemyTankBarrelImg.src = "/assets/enemy_barrel.png";
    enemyTankBarrelRef.current = enemyTankBarrelImg;

    const stats = loadStats();
    setStoredScore(stats?.score || 0);
  }, []);

  function moveEnemy(
    enemy: { x: number; y: number },
    player: { x: number; y: number },
    radius: number = 20
  ) {
    const dirX = player.x - enemy.x;
    const dirY = player.y - enemy.y;
    const len = Math.hypot(dirX, dirY) || 1;

    const moveX = (dirX / len) * enemySpeedRef.current;
    const moveY = (dirY / len) * enemySpeedRef.current;

    const steps = 4;
    const stepX = moveX / steps;
    const stepY = moveY / steps;

    for (let i = 0; i < steps; i++) {
      let tryX = enemy.x + stepX;
      let tryY = enemy.y + stepY;

      // --- Obstacle collision ---
      for (const obj of objects) {
        if (
          obj.solid &&
          circleIntersect(tryX, tryY, radius, obj.x, obj.y, obj.radius)
        ) {
          const dxOverlap = tryX - obj.x;
          const dyOverlap = tryY - obj.y;
          const dist = Math.hypot(dxOverlap, dyOverlap) || 1;
          const overlap = radius + obj.radius - dist;

          tryX += (dxOverlap / dist) * overlap;
          tryY += (dyOverlap / dist) * overlap;
        }
      }

      // --- Enemy-to-enemy collision ---
      for (const other of enemiesRef.current) {
        if (other === enemy) continue;
        const dx = other.x - tryX;
        const dy = other.y - tryY;
        const dist = Math.hypot(dx, dy) || 1;
        const minDist = radius * 2;

        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          tryX -= nx * overlap; // push this enemy
          tryY -= ny * overlap;
          other.x += nx * overlap; // push other enemy
          other.y += ny * overlap;
        }
      }

      // --- Enemy-to-player collision ---
      const dxP = player.x - tryX;
      const dyP = player.y - tryY;
      const distP = Math.hypot(dxP, dyP) || 1;
      const minDistP = radius + playerRef.current.radius;

      if (distP < minDistP) {
        const overlap = (minDistP - distP) / 2;
        const nx = dxP / distP;
        const ny = dyP / distP;

        tryX -= nx * overlap; // push enemy
        tryY -= ny * overlap;
        player.x += nx * overlap; // optionally push player
        player.y += ny * overlap;
      }

      enemy.x = tryX;
      enemy.y = tryY;
    }
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} style={{ overflow: "hidden" }} />

      {showGameOver && (
        <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-8 py-6 rounded-lg text-center">
          <h2 className="text-2xl mb-4">Game Over</h2>
          <p className="mb-4">Your score: {score}</p>
          <p className="mb-4">Your money: {(storedScore || 0) + score}</p>
          <div className="flex flex-col gap-1">
            <button
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => location.reload()}
            >
              Restart Game
            </button>
            <button
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => (window.location.href = "/upgrades")}
            >
              Go to Upgrades
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// helper collision function
function rectIntersect(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function circleIntersect(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  return dist < r1 + r2;
}

function generateObjects() {
  const objs: WorldObject[] = [];

  function randomPos(margin = 100) {
    return {
      x: Math.random() * (WORLD_WIDTH - margin * 2) + margin,
      y: Math.random() * (WORLD_HEIGHT - margin * 2) + margin,
    };
  }

  function isColliding(x: number, y: number, radius: number) {
    return objs.some((obj) =>
      circleIntersect(x, y, radius, obj.x, obj.y, obj.radius)
    );
  }

  function placeObject(id: string, radius: number, solid: boolean) {
    let pos;
    let attempts = 0;
    do {
      pos = randomPos();
      attempts++;
      if (attempts > 100) break; // prevent infinite loop
    } while (isColliding(pos.x, pos.y, radius));

    objs.push({
      id,
      x: pos.x,
      y: pos.y,
      width: radius * 2,
      height: radius * 2,
      radius,
      solid,
    });
  }

  // Trees
  for (let i = 0; i < 250; i++) placeObject("tree", 60, true);

  // Rocks
  for (let i = 0; i < 100; i++) placeObject("rock", 60, true);

  // Chest
  placeObject("chest", 20, false);

  return objs;
}
