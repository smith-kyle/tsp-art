const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports.orderPoints = function(points) {
  const header =
    'NAME : p5\n' +
    'COMMENT : Nada\n' +
    'TYPE : TSP\n' +
    `DIMENSION : ${points.length - 1}\n` +
    'EDGE_WEIGHT_TYPE : EUC_2D\n' +
    'NODE_COORD_SECTION\n';

  const pointsString = points.map(([x, y], i) => `${i} ${x} ${y}`).join('\n');
  const fileContent = header + pointsString;

  const tspFilePath = path.join(__dirname, 'build', 'points.tsp');
  fs.writeFileSync(tspFilePath, fileContent);

  const concordeCommand = `concorde ${tspFilePath}`;
  execSync(concordeCommand);

  console.log('here');
  return new Promise((resolve) => {
    setTimeout(() => {
      const solutionString = fs.readFileSync(path.join(__dirname, 'points.sol')).toString();
      const solutionIndeces = solutionString.match(/\S+/g);
      console.log('and here');
      const solution = solutionIndeces.map(i => points[i]);
      resolve(solution);
    }, 5000);
  });
}
