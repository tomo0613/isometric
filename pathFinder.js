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
const _from = new Vector2();
const _to = new Vector2();
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
        _from.x = Math.valBetween(Math.floor(payload.from.x / tileWidth), 0, grid.width - 1);
        _from.y = Math.valBetween(Math.floor(payload.from.y / tileHeight), 0, grid.height - 1);
        _to.x = Math.valBetween(Math.floor(payload.to.x / tileWidth), 0, grid.width - 1);
        _to.y = Math.valBetween(Math.floor(payload.to.y / tileHeight), 0, grid.height - 1);
        
        // ToDo return target if no need for path finding (same tile)

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
