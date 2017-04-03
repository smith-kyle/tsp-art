const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const RUN_TIME = 20000;

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

  console.log('before the execution');
  const concordeCommand = `concorde ${tspFilePath}`;
  exec(concordeCommand, { cwd: path.join(__dirname, 'build'), timeout: RUN_TIME });

  console.log('here');
  return new Promise((resolve) => {
    setTimeout(() => {
      const solutionString = fs.readFileSync(path.join(__dirname, 'build', 'points.sol')).toString();
      const solutionIndeces = solutionString.match(/\S+/g);
      console.log('and here');
      const solution = solutionIndeces.map(i => points[i]);
      resolve(solution);
    }, RUN_TIME);
  });
}
