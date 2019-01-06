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
const _from = {x: 0, y: 0};
const _to = {x: 0, y: 0};
let grid;
let path;
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
        _from.x = Math.floor(payload.from.x / tileWidth);
        _from.y = Math.floor(payload.from.y / tileHeight);
        _to.x = Math.floor(payload.to.x / tileWidth);
        _to.y = Math.floor(payload.to.y / tileHeight);

        path = pathFinder.findPath(_from.x, _from.y, _to.x, _to.y, grid.clone());
        path = path.map(([xIndex, yIndex]) => {
            return new Vector2(
                xIndex * tileWidth + tileWidth / 2,
                yIndex * tileHeight + tileHeight / 2
            );
        });

        self.postMessage({
            type: 'path',
            path,
        });
    },
};
