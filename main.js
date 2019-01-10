import {createCanvasRenderer, createScene} from './canvasRenderer.js';
import {Tile, Creature} from './assetHelper.js';
import {parseSpriteSheet} from './spriteSheetHelper.js';
import mapHelper from './mapHelper.js';
import utils from './utils.js';

const renderer = createCanvasRenderer();
const scene = createScene(512, 512);

let testEntity;

async function init() {
    const [floorSheet, wallSheet, paladinSheet] = await Promise.all([
        utils.loadImage('./img/floor_sheet.png'),
        utils.loadImage('./img/wall_sheet.png'),
        utils.loadImage('./img/paladin_sheet_96x96.png'),
    ]);

    const groundTileSprites = parseSpriteSheet(floorSheet, 182, 182, {
        f0: (spriteSheet) => spriteSheet.get([0, 0]),
        f1: (spriteSheet) => spriteSheet.get([1, 1]),
        f2: (spriteSheet) => spriteSheet.get([1, 2]),
        f3: (spriteSheet) => spriteSheet.get([1, 3]),
        f4: (spriteSheet) => spriteSheet.get([1, 4]),
        f5: (spriteSheet) => spriteSheet.get([0, 5]),
    });

    const wallTileSprites = parseSpriteSheet(wallSheet, 182, 182, {
        w0: (spriteSheet) => spriteSheet.get([0, 0]),
        w1: (spriteSheet) => spriteSheet.get([0, 1]),
        w2: (spriteSheet) => spriteSheet.get([0, 2]),
        w3: (spriteSheet) => spriteSheet.get([0, 3]),
    });

    // separate createFrameGettersForDirections()
    const paladinSheetFrameGetters = [
        {name: 'idle', frameCount: 20},
        {name: 'walk', frameCount: 8, startRow: 8},
    ].reduce((frameGetters, {name, frameCount, startRow = 0}) => {
        return ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'].reduce((getters, direction, index) => {
            getters[name + '_' + direction] = (spriteSheet) => {
                return spriteSheet.from(startRow + index, 0).to(startRow + index, frameCount - 1).get();
            };

            return getters;
        }, frameGetters);
    }, {});
    const paladinSprites = parseSpriteSheet(paladinSheet, 96, 97, paladinSheetFrameGetters, {});

    testEntity = new Creature(paladinSprites.idle_s, 45, 45);
    testEntity.position.set(182, 182);
    testEntity.animationOffset.set(-20, -55);
    testEntity.animationClip.speed = 120;

    testEntity.changeListener.addListener('stateChange', (previousAction, currentAction) => {
        // ToDo state.action & direction
        testEntity.animationClip.setFrames(paladinSprites[currentAction + '_' + testEntity.direction]);
    });

    testEntity.changeListener.addListener('collision', (collidingAsset) => {});

    scene.viewPort.position = testEntity.position; // follow character

    scene.createNewLayer();
    scene.layers[1].addAsset(testEntity);

    let floorId;
    let wallId;
    let _tile;
    mapHelper.buildMap(mapHelper.mapData, (tileData, rowIndex, columnIndex) => {
        [floorId, wallId] = tileData.split('_');

        if (floorId) {
            _tile = new Tile(groundTileSprites[floorId]);
            _tile.position.set(columnIndex * _tile.width / 2, rowIndex * _tile.height / 2);
            scene.layers[0].addAsset(_tile);
        }
        if (wallId) {
            _tile = new Tile(wallTileSprites[wallId]);
            _tile.position.set(columnIndex * _tile.width / 2, rowIndex * _tile.height / 2);
            scene.layers[1].addAsset(_tile);

            scene.collisionHelper.addAsset(_tile);
        }
    });

    mapHelper.initPathfinder(mapHelper.mapData, 91, 91);
    
    const mouseListener = (e) => {
        // ToDo start on 'mousedown' finish on 'mouseup'
        if (e.target.nodeName !== 'CANVAS') {
            return;
        }

        const targetPos = scene.viewPort.resolveScreenPosition(e.offsetX, e.offsetY);

        mapHelper.getPath(testEntity.position, targetPos, testEntity.width, testEntity.height)
            .then((path) => testEntity.initAction('walk', path))
            .catch((e) => console.error(e));
    }

    addEventListener('mousedown', mouseListener);
    // ['mousedown', 'mouseup', 'mousemove'].forEach((eventType) => window.addEventListener(eventType, mouseListener));

    renderer.render(scene);
}

init();

addEventListener('keydown', (e) => {
    if (e.key == 'w') {
        testEntity.position.y -= 10;
    }
    if (e.key == 's') {
        testEntity.position.y += 10;
    }
    if (e.key == 'a') {
        testEntity.position.x -= 10;
    }
    if (e.key == 'd') {
        testEntity.position.x += 10;
    }
    ////////////////////
    if (e.key == 'q') {
        testEntity.velocity.set(10, 10);
    }
    if (e.key == 'e') {
        testEntity.velocity.set(0, 0);
    }
    if (e.key == 'h') {
        console.log(
            testEntity
        );
    }
    if (e.key == '+') {
        testEntity.movementSpeed += 10;
    }
    if (e.key == '-' && testEntity.movementSpeed > 0) {
        testEntity.movementSpeed -= 10;
    }
});
