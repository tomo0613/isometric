/* 
 * worker
 */
self.importScripts('lib/pathfinding-browser.min.js', 'globals.js');
// https://github.com/qiao/PathFinding.js/

const dir = {
    N: new Vector2(0, -1),
    NE: new Vector2(1, -1),
    NW: new Vector2(-1, -1),
    S: new Vector2(0, 1),
    SE: new Vector2(-1, 1),
    SW: new Vector2(1, 1),
    E: new Vector2(1, 0),
    W: new Vector2(-1, 0),
};
const pathFinder = new PF.BiBestFirstFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
    heuristic: PF.Heuristic.chebyshev,
});

let grid;
let tileWidth = 0;
let tileHeight = 0;

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
            path: findPath(payload.originPosition,  payload.targetPosition, payload.assetWidth, payload.assetHeight),
        });
    },
};

const _origin = new Vector2();
const _target = new Vector2();
const _directionBefore = new Vector2();
const _directionAfter = new Vector2();
let path;

function findPath(originPosition, targetPosition, assetWidth = tileWidth, assetHeight = tileHeight) {
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

    const originIndices = path.shift(); // do not set origin position as target
    const wayPointOffset = new Vector2();
    let wayPointAlignment;

    return path.reduce((wayPoints, [xIndex, yIndex], i) => {
        if (i === path.length - 1) {
            wayPoints.push(targetPosition); // ToDo check isWalkable ?

            return wayPoints;
        }

        setAdjacentDirectionsByIndices(i ? path[i-1] : originIndices, path[i], path[i + 1])(
            _directionBefore,
            _directionAfter
        );

        if (_directionBefore.equals(_directionAfter)) {
            return wayPoints;
        }

        wayPointAlignment = getWayPointAlignmentByAdjacentDirections(_directionBefore, _directionAfter);
        wayPointOffset.set(
            wayPointAlignment.includes('left') ? (assetWidth / 2) : (tileWidth - assetWidth / 2),
            wayPointAlignment.includes('top') ? (assetHeight / 2) : (tileHeight - assetHeight / 2)
        );

        wayPoints.push(
            new Vector2(
                xIndex * tileWidth + wayPointOffset.x,
                yIndex * tileHeight + wayPointOffset.y
            )
        );

        return wayPoints;
    }, []);
}

function setAdjacentDirectionsByIndices([xIndexBefore, yIndexBefore], [xIndex, yIndex], [xIndexAfter, yIndexAfter]) {
    return (directionBefore, directionAfter) => {
        directionBefore.set(xIndex - xIndexBefore, yIndex - yIndexBefore);
        directionAfter.set(xIndexAfter - xIndex, yIndexAfter - yIndex);
    };
}

// ToDo refactor
function getWayPointAlignmentByAdjacentDirections(dirBefore, dirAfter) {
    if ((dirBefore.equals(dir.N) && (dirAfter.equals(dir.NW) || dirAfter.equals(dir.W)))
        || (dirBefore.equals(dir.E) && (dirAfter.equals(dir.SE) || dirAfter.equals(dir.S)))
        || (dirBefore.equals(dir.NW) && dirAfter.equals(dir.W))
        || (dirBefore.equals(dir.SE) && dirAfter.equals(dir.S))
    ) {
        return 'bottom-left'
    }

    if ((dirBefore.equals(dir.N) && (dirAfter.equals(dir.NE) || dirAfter.equals(dir.E)))
        || (dirBefore.equals(dir.W) && (dirAfter.equals(dir.SW) || dirAfter.equals(dir.S)))
        || (dirBefore.equals(dir.NE) && dirAfter.equals(dir.E))
        || (dirBefore.equals(dir.SW) && dirAfter.equals(dir.S))
    ) {
        return 'bottom-right'
    }

    if ((dirBefore.equals(dir.E) && (dirAfter.equals(dir.NE) || dirAfter.equals(dir.N)))
        || (dirBefore.equals(dir.S) && (dirAfter.equals(dir.SW) || dirAfter.equals(dir.W)))
        || (dirBefore.equals(dir.NE) && dirAfter.equals(dir.N))
        || (dirBefore.equals(dir.SW) && dirAfter.equals(dir.W))
    ) {
        return 'top-left'
    }
    
    if ((dirBefore.equals(dir.S) && (dirAfter.equals(dir.SE) || dirAfter.equals(dir.E)))
        || (dirBefore.equals(dir.W) && (dirAfter.equals(dir.NW) || dirAfter.equals(dir.N)))
        || (dirBefore.equals(dir.SE) && dirAfter.equals(dir.E))
        || (dirBefore.equals(dir.Nw) && dirAfter.equals(dir.N))
    ) {
        return 'top-right'
    }
}
