/**
 * @param {HTMLImageElement} spriteSheet
 * @param {number} frameWidth 
 * @param {number} frameHeight
 * @param {Object} frameGetters - An object of functions, each returns a set of frames
 * @returns {Object} frame sets, named by getter object keys
 */
export function parseSpriteSheet(spriteSheet, frameWidth, frameHeight, frameGetters, options) { // options {scale, crop}
    const spriteSheetHelper = createSpriteSheetHelper(spriteSheet, frameWidth, frameHeight);

    return Object.keys(frameGetters).reduce((frameGroups, key) => {
        frameGroups[key] = frameGetters[key](spriteSheetHelper);

        return frameGroups;
    }, {});
}

function createSpriteSheetHelper(spriteSheet, frameWidth, frameHeight) {
    const rowCount = spriteSheet.height / frameHeight;
    const columnCount = spriteSheet.width / frameWidth;
    let frameRanges = [];

    const helperInterface = {
        get: extractFrames,
        from: setFrameExtractionStart,
        to: setFrameExtractionEnd,
    };

    return helperInterface;

    function getFrameIndices() {
        const frameIndicesToExtract = [];

        if (!frameRanges.length) {
            setFrameExtractionStart(0, 0);
        }

        frameRanges.forEach(({from, to}) => {            
            const [fromRowIndex, fromColumnIndex] = from;
            const [toRowIndex, toColumnIndex] = to;

            for (let rowIndex = fromRowIndex; rowIndex <= toRowIndex; rowIndex++) {
                for (let columnIndex = fromColumnIndex; columnIndex <= toColumnIndex; columnIndex++) {
                    frameIndicesToExtract.push([rowIndex, columnIndex]);
                }
            }
        });

        return frameIndicesToExtract;
    }

    function extractFrame(xIndex, yIndex) {
        return createFrameBuffer(spriteSheet, yIndex * frameWidth, xIndex * frameHeight, frameWidth, frameHeight);
    }

    function extractFrames(...frameIndices) {
        const frames = (frameIndices.length ? frameIndices : getFrameIndices()).map(([rowIndex, columnIndex]) => {
            return extractFrame(rowIndex, columnIndex);
        });

        frameRanges = [];

        return frames.length === 1 ? frames[0] : frames;
    }

    function setFrameExtractionStart(fromRowIndex, fromColumnIndex) {
        frameRanges.push({from: [fromRowIndex, fromColumnIndex], to: [rowCount, columnCount]});

        return helperInterface;
    };

    function setFrameExtractionEnd(toRowIndex, toColumnIndex) {
        if (!frameRanges.length) {
            setFrameExtractionStart(0, 0);
        }
        frameRanges[frameRanges.length - 1].to = [toRowIndex, toColumnIndex];
        
        return helperInterface;
    };
}

function createFrameBuffer(sprite, srcX, srcY, srcW, srcH, destX = 0, destY = 0, destW = srcW, destH = srcH) {
    const frameBuffer = document.createElement('canvas');

    frameBuffer.width = destW;
    frameBuffer.height = destH;

    frameBuffer.getContext('2d').drawImage(sprite, srcX, srcY, srcW, srcH, destX, destY, destW, destH);

    return frameBuffer;
}
