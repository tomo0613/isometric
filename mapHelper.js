const pathFinder = new Worker('pathFinder.js', {type: 'module'});

const mapData = [
    ['f0_w0', 'f3_w1', 'f2_w1', 'f3_w1', 'f4_w1'],
    ['f1_w2', 'f5   ', 'f0   ', 'f5   ', 'f1   '],
    ['f0_w2', 'f0   ', 'f5   ', 'f0   ', 'f0   '],
    ['f1_w2', 'f0   ', 'f0_w0', 'f0   ', 'f1_w3'],
    ['f0_w2', 'f3   ', 'f2   ', 'f3   ', 'f0   '],
    ['f0   ', 'f0   ', 'f0   ', 'f0   ', 'f0   '],
    ['f0   ', 'f0_w0', 'f0_w1', 'f0_w1', 'f0_w1'],
    ['f0   ', 'f0_w2', 'f0   ', 'f0   ', 'f0   '],
    ['f0   ', 'f0_w2', 'f0   ', 'f0_w3', 'f0   '],
    ['f0   ', 'f0_w2', 'f0   ', 'f0_w2', 'f0   '],
    ['f0   ', 'f0_w0', 'f0_w1', 'f0_w0', 'f0   '],
    ['f0   ', 'f0   ', 'f0   ', 'f0   ', 'f0   '],
];

export default {
    mapData,
    buildMap,
    initPathfinder,
    getPath,
};

function buildMap(grid, tileConstructor) {
    grid.forEach((gridRow, rowIndex) => {
        gridRow.forEach((tileData, columnIndex) => {
            tileData = tileData.trim();

            if (tileData) {
                tileData = tileConstructor(tileData, rowIndex, columnIndex);
            }
        });
    });
}


function initPathfinder(grid, tileWidth, tileHeight) {
    const pathFindingGrid = grid.map((gridRow) => gridRow.map((tileData) => {
        tileData = tileData.trim();

        return Number(!tileData || !!tileData.split('_')[1]);
    }));

    pathFinder.postMessage({
        type: 'init',
        payload: {
            grid: pathFindingGrid,
            tileWidth,
            tileHeight,
        },
    });
}

function getPath(originPosition, targetPosition, assetWidth, assetHeight) {
    return new Promise((resolve, reject) => {
        function errorHandler(e) {
            pathFinder.removeEventListener('error', errorHandler);
            pathFinder.removeEventListener('message', messageHandler);

            reject(e);
        }

        function messageHandler({data: response}) {
            pathFinder.removeEventListener('error', errorHandler);
            pathFinder.removeEventListener('message', messageHandler);

            if (response.type === 'path') {
                resolve(response.path);
            }
        }

        pathFinder.addEventListener('error', errorHandler);
        pathFinder.addEventListener('message', messageHandler);
        pathFinder.postMessage({
            type: 'getPath',
            payload: {originPosition, targetPosition, assetWidth, assetHeight},
        });
    });
}
