export function loadStats() {
  if (typeof window === "undefined")
    return {
      damage: 1,
      fireDelay: 1000,
      playerSpeed: 3.5,
      playerHealth: 100,
      score: 0,
    };

  const stored = localStorage.getItem("playerStats");
  return stored
    ? JSON.parse(stored)
    : {
        damage: 1,
        fireDelay: 1000,
        playerSpeed: 3.5,
        playerHealth: 100,
        score: 0,
      };
}

export function saveStats(stats: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem("playerStats", JSON.stringify(stats));
}
