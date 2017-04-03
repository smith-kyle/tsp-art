const path = require('path');
const fs = require('fs');
const jimp = require('jimp');
const salesman = require('./salesman');
const fp = require('lodash/fp');

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const MAX_CITIES_IN_CELL = 4;
const CELL_HEIGHT = 2;
const svgHeader = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

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
  console.log('imageToBrightnessGrid');
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
  console.log('getPointsForCell');
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
  console.log('getPointsFromCitiesGrid');
  let points = [];
  for(let i = 0; i < citiesGrid.length; i++) {
    for(let j = 0; j < citiesGrid[0].length; j++) {
      points = points.concat(getPointsForCell(i, j, citiesGrid[i][j]));
    }
  }

  return points;
}

function renderPoints(points) {
  console.log('renderPoints');
  ctx.fillStyle = '#000000';
  points.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
}

function renderLines(points) {
  console.log('renderLines');
  points.shift(); // There's a rogue point in there. Don't know why
  points.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.stroke();
}

function generateSvg(points) {
  console.log('generateSvg');
  points.shift();
  const svgLines = points.map(([x, y]) => i > 0 && i < points.length - 1
    ? `<line x1="${points[i - 1][0]}" y1="${points[i - 1][1]}" x2="${x}" y2="${y}" fill="black" stroke="2" />`
    : ''
  );
  const maxX = fp.maxBy(([x]) => x, points)[0];
  const maxY = fp.maxBy(([_, y]) => y, points)[1];
  const svgString = `${svgHeader}\n<svg viewBox="0 0 ${maxX} ${maxY}" version="1.1">\n${svgLines.join('\n')}\n</svg>`;
  fs.writeFileSync('./images/output.svg', svgString)
}

jimp.read('./images/gitkraken.png')
  .then(image => image.greyscale())
  .then(imageToBrightnessGrid)
  .then(brightnessGrid => brightnessGrid.map(row => row.map(getNumberOfCitiesFromBrightness)))
  .then(getPointsFromCitiesGrid)
  .then(salesman.orderPoints)
  .then(generateSvg)
  .catch(err => console.error(err));
