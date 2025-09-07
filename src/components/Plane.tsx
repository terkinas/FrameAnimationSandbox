// // components/Plane.ts
// export type PlaneType = {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// };

// export function Plane(
//   planeImg: HTMLImageElement,
//   plane: PlaneType,
//   ctx: CanvasRenderingContext2D
// ) {
//   // draw funkcija
//   function draw() {
//     ctx.save();
//     ctx.translate(plane.x, plane.y);
//     ctx.drawImage(
//       planeImg,
//       -plane.width / 2,
//       -plane.height / 2,
//       plane.width,
//       plane.height
//     );
//     ctx.restore();
//   }

//   return { draw, plane };
// }

// Plane.ts
export type PlaneType = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class Plane {
  planeImg: HTMLImageElement;
  plane: PlaneType;

  constructor(planeImg: HTMLImageElement, plane: PlaneType) {
    this.planeImg = planeImg;
    this.plane = plane;
  }

  angle: number = -90;

  draw(ctx: CanvasRenderingContext2D, direction?: "left" | "right" | "none") {
    if (direction === "left" && this.angle > -105) {
      this.angle -= 5;
    } else if (direction === "right" && this.angle < -75) {
      this.angle += 5;
    }

    ctx.save();
    ctx.translate(
      this.plane.x + this.plane.width / 2,
      this.plane.y + this.plane.height / 2
    );
    ctx.rotate(
      (Math.PI / 180) *
        // (direction == "right" ? -75 : direction == "left" ? -105 : -90)
        this.angle
    ); // pasukimas
    ctx.drawImage(
      this.planeImg,
      -this.plane.width / 2,
      -this.plane.height / 2,
      this.plane.width * 2,
      this.plane.height * 1.25
    );
    ctx.restore();
  }

  move(dx: number, dy: number, canvasWidth: number, canvasHeight: number) {
    this.plane.x += dx;
    this.plane.y += dy;

    // ribos, kad nepabėgtų už canvas
    if (this.plane.x < 0) this.plane.x = 0;
    if (this.plane.x + this.plane.width > canvasWidth)
      this.plane.x = canvasWidth - this.plane.width;
    if (this.plane.y < 0) this.plane.y = 0;
    if (this.plane.y + this.plane.height > canvasHeight)
      this.plane.y = canvasHeight - this.plane.height;
  }

  rotate(angle: number) {}
}
