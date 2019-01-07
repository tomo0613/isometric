/* 
 * worker
 */
self.importScripts('lib/pathfinding-browser.min.js', 'globals.js');
// https://github.com/qiao/PathFinding.js/

const pathFinder = new PF.BiBestFirstFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
    heuristic: PF.Heuristic.chebyshev,
});

let grid;
let tileWidth;
let tileHeight;

self.addEventListener('message', ({data: action}) => actions[action.type](action.payload));

const actions = {
    init(payload) {
        grid = new PF.Grid(payload.grid);
        tileWidth = payload.tileWidth;
        tileHeight = payload.tileHeight;     
    },
    getPath(payload) {
        self.postMessage({
            type: 'path',
            path: findPath(payload.originPosition,  payload.targetPosition),
        });
    },
};

const _origin = new Vector2();
const _target = new Vector2();
let path;

function findPath(originPosition, targetPosition) {
    _origin.set(
        Math.valBetween(Math.floor(originPosition.x / tileWidth), 0, grid.width - 1),
        Math.valBetween(Math.floor(originPosition.y / tileHeight), 0, grid.height - 1)
    );
    _target.set(
        Math.valBetween(Math.floor(targetPosition.x / tileWidth), 0, grid.width - 1),
        Math.valBetween(Math.floor(targetPosition.y / tileHeight), 0, grid.height - 1)
    );

    if (_origin.equals(_target)) {
        return [targetPosition];
    }

    path = pathFinder.findPath(_origin.x, _origin.y, _target.x, _target.y, grid.clone());
    path.shift(); // origin is not needed

    // console.log(path);
    // ToDo optimize path

    return path.map(([xIndex, yIndex], i) => {
        if (i === path.length - 1) {
            return targetPosition;
        }
        return new Vector2(
            xIndex * tileWidth + tileWidth / 2,
            yIndex * tileHeight + tileHeight / 2
        );
    });
}
