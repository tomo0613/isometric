class ViewPort {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.position = new Vector2(),
        this.previousRenderedPosition = new Vector2();
        this._position = new Vector2();
    }

    getAssetScreenPosition(asset) {
        this._position.set(
            asset.position.x - this.position.x,
            asset.position.y - this.position.y
        );
        // convert cartesian to isometric
        this._position.set(
            this._position.x - this._position.y,
            (this._position.x + this._position.y) / 2
        );

        return this._position.set(
            this._position.x - asset.height / 2 + this.height / 2,
            this._position.y - asset.width / 2 + this.width / 2
        );
    }

    resolveScreenPosition(x, y) {
        x = x - this.width / 2;
        y = y - this.height / 2;
        // convert isometric to cartesian
        x = (2 * y + x) / 2;
        y = 2 * y - x;

        x = x + this.position.x;
        y = y + this.position.y;

        return this._position.set(x, y);
    }
}

class CollisionHelper {
    constructor() {
        this.assets = [];
    }

    addAsset(...assets) {
        this.assets.push(...assets);
    }

    getNearestBlockingAssets(asset) {
        // ToDo 
        return this.assets;
    }
}

export function createCanvasRenderer() {
    const simulationStep = 1/120; // resolution of simulations (ms)
    const simulationLimit = 120; // max allowed simulations before next render
    let simulationCount = 0;
    let simulationLag = 0;
    let elapsedTime = 0;
    let prevTimeStamp = 0;

    let gScene;

    function updateLayer(layer) {
        layer.updatePhysics(simulationStep, gScene.collisionHelper);
    }
    function updateScene() {
        gScene.layers.forEach(updateLayer);
    }

    function drawLayer(layer) {
        layer.render(gScene.viewPort);
    }
    function drawScene() {
        gScene.layers.forEach(drawLayer);
    }

    function simulate(elapsedTime) {
        simulationCount = 0;
        simulationLag += elapsedTime;
    
        while (simulationLag > simulationStep) {
            simulationLag -= simulationStep;
            updateScene();
    
            if (++simulationCount >= simulationLimit) {
                simulationLag = 0;
                break;
            }
        }
    }

    function render(timeStamp = performance.now()) {
        elapsedTime = (timeStamp - (prevTimeStamp || performance.now())) * 0.001;
        simulate(elapsedTime);
        drawScene();
    
        prevTimeStamp = timeStamp;
    
        requestAnimationFrame(render);
    }


    return {
        render: (scene) => {
            gScene = scene;
            render();
        },
        pause: () => {},
    };
};

export function createScene(width = window.innerWidth, height = window.innerHeight) {
    const collisionHelper = new CollisionHelper();
    const layers = [];
    const viewPort = new ViewPort(width, height);

    createNewLayer();

    return {
        collisionHelper,
        layers,
        viewPort,
        createNewLayer,
    };

    function createNewLayer(zIndex = 0, containerElement) {
        const layer = createLayer(containerElement);
        layer.setSize(width, height);
        layer.setZIndex(zIndex);

        return layers.push(layer) - 1;
    };
}

function createLayer(containerElement = getBodyElement()) {
    const canvas = document.createElement('canvas');
    const drawContext = canvas.getContext('2d');
    const assets = [];
    const clearCanvas = () => drawContext.clearRect(0, 0, canvas.width, canvas.height);

    containerElement.appendChild(canvas);

    centerCanvas(canvas);

    return {
        assets,
        addAsset: (...asset) => {
            return assets.push(...asset) - 1;
        },
        hideAsset: (index) => {
            
        },
        updatePhysics: (dt, collisionHelper) => {
            assets.forEach((asset) => asset.updatePosition && asset.updatePosition(dt, collisionHelper));
        },
        render: (viewPort) => {
            if (assets.some((asset) => asset.shouldReRender(viewPort))) {
                clearCanvas();

                assets.sort(depthSortAssets);
                assets.forEach((asset) => asset.render(drawContext, viewPort));

                viewPort.previousRenderedPosition.copy(viewPort.position);
            }
        },
        clear: clearCanvas,
        setSize: (width = window.innerWidth, height = window.innerHeight) => {
            canvas.width = width;
            canvas.height = height;
        },
        setZIndex: (i = 0) => {
            canvas.style['z-index'] = i;
        },
    };
}

function depthSortAssets(assetA, assetB) {
    return Number(assetA.depth > assetB.depth);
}

function centerCanvas(canvas) {
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

function getBodyElement() {
    return document.querySelector('body');
}
