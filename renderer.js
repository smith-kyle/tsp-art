const path = require('path');
const jimp = require('jimp');
const salesman = require('./salesman');

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const MAX_CITIES_IN_CELL = 4;
const CELL_HEIGHT = 10;

function rgbToBrightness(r, g, b) {
  return (0.2126 * r + 0.715 * g + 0.0722 * b) / 255;
}

function boostContrast(numCities) {
  return Math.floor((1 / 3) * Math.pow(numCities, 2));
}

function getNumberOfCitiesFromBrightness(brightness) {
  return boostContrast(MAX_CITIES_IN_CELL - Math.floor((MAX_CITIES_IN_CELL + 1) * brightness));
}

function imageToBrightnessGrid(image) {
  const numCellsPerColumn = Math.floor(image.bitmap.height / CELL_HEIGHT);
  const numCellsPerRow = Math.floor(image.bitmap.width / CELL_HEIGHT);
  const A = new Array(numCellsPerColumn);
  for(let i = 0; i < A.length; i++) {
    A[i] = new Array(numCellsPerRow);
  }

  image.scan(0, 0, numCellsPerRow * CELL_HEIGHT - 1, numCellsPerColumn * CELL_HEIGHT - 1, (x, y) => {
    const pixelColor = image.getPixelColor(x, y);
    const { r, g, b } = jimp.intToRGBA(pixelColor);
    const pixelBrightness = rgbToBrightness(r, g, b);

    const gridX = Math.floor(x / CELL_HEIGHT);
    const gridY = Math.floor(y / CELL_HEIGHT);

    if (A[gridY][gridX]) {
      const [ avg, count ] = A[gridY][gridX];
      const newAvg = (avg * count + pixelBrightness) / (count + 1);
      A[gridY][gridX] = [ newAvg, count + 1];
    } else {
      A[gridY][gridX] = [ pixelBrightness, 1 ];
    }
  });

  for(let i = 0; i < numCellsPerColumn; i++) {
    for (let j = 0; j < numCellsPerRow; j++) {
      A[i][j] = A[i][j][0];
    }
  }

  return A;
}

function getPointsForCell(cellI, cellJ, cities) {
  const points = [];
  for(let i = 0; i < cities; i++) {
    const point = [
      cellJ * CELL_HEIGHT + Math.random() * CELL_HEIGHT,
      cellI * CELL_HEIGHT + Math.random() * CELL_HEIGHT
    ];
    points.push(point);
  }

  return points;
}

function getPointsFromCitiesGrid(citiesGrid) {
  let points = [];
  for(let i = 0; i < citiesGrid.length; i++) {
    for(let j = 0; j < citiesGrid[0].length; j++) {
      points = points.concat(getPointsForCell(i, j, citiesGrid[i][j]));
    }
  }

  return points;
}

function renderPoints(points) {
  ctx.fillStyle = '#000000';
  points.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
}

function renderLines(points) {
  ctx.lineTo(points[0][0], points[0][1]);
  points.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.stroke();
}

function orderPoints(points) {
  const salesmanPoints = points.map(([x, y]) => new salesman.Point(x, y))
  return salesman.solve(salesmanPoints).map(i => [salesmanPoints[i].x, salesmanPoints[i].y]);
}

jimp.read('./images/john.jpeg')
  .then(image => image.greyscale())
  .then(imageToBrightnessGrid)
  .then(brightnessGrid => brightnessGrid.map(row => row.map(getNumberOfCitiesFromBrightness)))
  .then(getPointsFromCitiesGrid)
  // .then(orderPoints)
  .then(renderPoints)
  .catch(err => console.error(err));
