// export default function drawImageFull(
//   ctx: CanvasRenderingContext2D,
//   img: HTMLImageElement,
//   canvasWidth: number,
//   canvasHeight: number
// ) {
//   const imgRatio = img.width / img.height;
//   const canvasRatio = canvasWidth / canvasHeight;

//   let drawWidth: number;
//   let drawHeight: number;

//   if (canvasRatio > imgRatio) {
//     // Canvas platesnis nei nuotrauka
//     drawHeight = canvasHeight;
//     drawWidth = img.width * (canvasHeight / img.height);
//   } else {
//     // Canvas aukštesnis nei nuotrauka
//     drawWidth = canvasWidth;
//     drawHeight = img.height * (canvasWidth / img.width);
//   }

//   // Centrinimas X/Y
//   const offsetX = (canvasWidth - drawWidth) / 2;
//   const offsetY = (canvasHeight - drawHeight) / 2;

//   ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
// }

let offsetY = 0;
let speed = 5; // kiek pikselių per frame juda

export default function drawScrollingBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) {
  const imgRatio = img.width / img.height;
  let drawWidth: number;
  let drawHeight: number;

  if (canvasWidth / canvasHeight > imgRatio) {
    drawHeight = canvasHeight;
    drawWidth = img.width * (canvasHeight / img.height);
  } else {
    drawWidth = canvasWidth;
    drawHeight = img.height * (canvasWidth / img.width);
  }

  offsetY += speed;
  speed += 0.001; // greitis didėja
  if (offsetY >= drawHeight) offsetY = 0;

  const offsetX = (canvasWidth - drawWidth) / 2;

  // Piešiame du kartus, kad tilptų loop
  ctx.drawImage(img, offsetX, offsetY - drawHeight, drawWidth, drawHeight);
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  ctx.drawImage(img, offsetX, offsetY + drawHeight, drawWidth, drawHeight);
}
