// Obstacle.ts
export type ObstacleType = {
  y: number;
  height: number;
  gapStart: number;
  gapHeight: number;
};

export class Obstacle {
  obstacle: ObstacleType;
  speed: number;
  obstacleImg: HTMLImageElement;

  pattern: CanvasPattern;

  hitboxDecrease = 7;

  constructor(
    obstaclePattern: CanvasPattern,
    obstacleImg: HTMLImageElement,
    y: number,
    canvasWidth: number
  ) {
    const gapHeight = canvasWidth / (canvasWidth < 400 ? 2 : 3); // tarpas lektuvui
    const gapStart = Math.random() * (canvasWidth - gapHeight - 40) + 20;
    this.obstacle = { y, height: 44, gapStart, gapHeight };
    // this.speed = 2;
    this.speed = canvasWidth > 600 ? 3 : 5;
    this.obstacleImg = obstacleImg;
    this.pattern = obstaclePattern;

    console.log("pattern", obstaclePattern);
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number) {
    this.speed += 0.001;

    //   if (!this.pattern && this.obstacleImg.complete) {
    //   this.pattern = ctx.createPattern(this.obstacleImg, "repeat-x");
    // }

    //   if (!this.pattern && this.obstacleImg.complete) {
    //     this.pattern = ctx.createPattern(this.obstacleImg, "repeat-x");
    //   }

    // ctx.fillStyle = this.pattern || "green";

    // // kairė siena
    // ctx.fillRect(
    //   0,
    //   this.obstacle.y,
    //   this.obstacle.gapStart,
    //   this.obstacle.height
    // );

    // // dešinė siena
    // ctx.fillRect(
    //   this.obstacle.gapStart + this.obstacle.gapHeight,
    //   this.obstacle.y,
    //   canvasWidth - (this.obstacle.gapStart + this.obstacle.gapHeight),
    //   this.obstacle.height
    // );

    const imgWidth = this.obstacleImg.width;
    const imgHeight = this.obstacle.height; // aukštis obstacle

    // kairė siena
    for (let x = 0; x < this.obstacle.gapStart; x += imgWidth) {
      const w = Math.min(imgWidth, this.obstacle.gapStart - x); // nupjaunam paskutinę dalį
      ctx.drawImage(
        this.obstacleImg,
        0,
        0,
        w, // imame tik tiek iš nuotraukos
        this.obstacleImg.height,
        x,
        this.obstacle.y,
        w,
        imgHeight
      );
    }

    // dešinė siena
    const rightStart = this.obstacle.gapStart + this.obstacle.gapHeight;
    for (let x = rightStart; x < canvasWidth; x += imgWidth) {
      const w = Math.min(imgWidth, canvasWidth - x); // nupjaunam paskutinę dalį
      ctx.drawImage(
        this.obstacleImg,
        0,
        0,
        w,
        this.obstacleImg.height,
        x,
        this.obstacle.y,
        w,
        imgHeight
      );
    }

    //   ctx.drawImage(
    //     this.obstacleImg,
    //     0,
    //     this.obstacle.y,
    //     this.obstacle.gapStart,
    //     this.obstacle.height
    //   );
    //   ctx.drawImage(
    //     this.obstacleImg,
    //     this.obstacle.gapStart + this.obstacle.gapHeight,
    //     this.obstacle.y,
    //     canvasWidth - (this.obstacle.gapStart + this.obstacle.gapHeight),
    //     this.obstacle.height
    //   );
  }

  update() {
    this.obstacle.y += this.speed;
  }

  isOffScreen(canvasHeight: number) {
    return this.obstacle.y > canvasHeight;
  }

  // collision check
  collides(plane: { x: number; y: number; width: number; height: number }) {
    return (
      plane.y < this.obstacle.y - this.hitboxDecrease + this.obstacle.height &&
      plane.y + plane.height > this.obstacle.y &&
      (plane.x < this.obstacle.gapStart - this.hitboxDecrease ||
        plane.x + plane.width - this.hitboxDecrease >
          this.obstacle.gapStart + this.obstacle.gapHeight)
    );
  }
}
