import actions from './actions.js';

const axes = ['x', 'y'];
const directions = ['se', 's', 'sw', 'w', 'nw', 'n', 'ne', 'e'];

class AnimationClip {
    constructor(animationFrames = [], animationSpeed = 60) {
        this.startTime = performance.now();
        this.frames = animationFrames;
        this.speed = animationSpeed;
        this.frameIndex = 0;
        this.paused = false;
    }

    setFrames(animationFrames, animationSpeed) {
        if (animationSpeed) {
            this.speed = animationSpeed;
        }
        this.frames = animationFrames;
    }

    getNextFrame() {
        this.frameIndex = this.getNextFrameIndex();
        
        return this.frames[this.frameIndex];
    }

    getNextFrameIndex() {
        if (this.frames.length === 1 || this.paused) {
            return this.frameIndex;
        }
        return Math.floor((performance.now() - this.startTime) / this.speed % this.frames.length);
    }

    stop() {
        this.paused = true;
    }

    play() {
        this.paused = false;
        this.startTime = performance.now();
    }
}

export class Asset {
    constructor(frames, width, height) {
        if (!Array.isArray(frames)) {
            frames = [frames];
        }
        this.width = width || frames[0].width;
        this.height = height || frames[0].height;
        this.position = new Vector2();
        this.previousRenderedPosition = new Vector2();
        this.screenPosition = new Vector2();
        this.animationClip = new AnimationClip(frames);
        this.animationOffset = new Vector2();
        this._boundingRect = {top: 0, left: 0, right: 0, bottom: 0};
    }

    render(drawContext, viewPort) {
        // ToDo if (offscreen) {return}
        this.screenPosition = viewPort.getAssetScreenPosition(this);

        drawContext.drawImage(
            this.animationClip.getNextFrame(),
            this.screenPosition.x + this.animationOffset.x,
            this.screenPosition.y + this.animationOffset.y
        );

        this.previousRenderedPosition.copy(this.position);

        // ToDo delete
        // if (true) {
        //     drawContext.strokeStyle = "rgba(255, 0, 0, 1)";
        //     drawContext.strokeRect(
        //         this.screenPosition.x,
        //         this.screenPosition.y,
        //         this.width,
        //         this.height
        //     );
        // }
    }

    shouldReRender(viewPort) {
        return this.animationClip.frameIndex !== this.animationClip.getNextFrameIndex()
            || !this.position.equals(this.previousRenderedPosition)
            || !viewPort.position.equals(viewPort.previousRenderedPosition);
    }

    get boundingRect() {
        this._boundingRect.top = this.position.y - this.height / 2;
        this._boundingRect.left = this.position.x - this.width / 2;
        this._boundingRect.right = this.position.x + this.width / 2;
        this._boundingRect.bottom = this.position.y + this.height / 2;

        return this._boundingRect;
    }

    get depth() {
        return this.position.x + this.position.y;
    }
}

export class Tile extends Asset {
    constructor(frames, width, height) {
        super(frames, width, height);
    }

    get boundingRect() {
        this._boundingRect.top = this.position.y;
        this._boundingRect.left = this.position.x;
        this._boundingRect.right = this.position.x + this.width / 2;
        this._boundingRect.bottom = this.position.y + this.height / 2;

        return this._boundingRect;
    }

    get depth() {
        return this.position.x + this.position.y + this.width / 2;
    }
}

let _cacheIndex = '';
const _cache = {
    direction: {},
};

export class Creature extends Asset {
    constructor(frames, width, height) {
        super(frames, width, height);

        this.changeListener = new Listener();
        // this.velocity = new Proxy(new Vector2(), this._getStateChangeHandler());
        this.velocity = new Vector2();
        this.movementSpeed = 200;
        // ToDo
        this.currentAction = 'idle';
        this._originPosition = new Vector2();
        this._targetPosition = new Vector2();
        this._tmp = {};
    }

    initAction(actionType, target) {
        this.terminateAction(); // refactor
        
        actions[actionType].init(this, target);
    }

    terminateAction() {
        if (this.currentAction === 'idle') {
            return;
        }

        actions[this.currentAction].terminate(this);

        this._tmp.previousAction = this.currentAction;
        this.currentAction = 'idle';

        this.changeListener.dispatchEvent('stateChange', this._tmp.previousAction, this.currentAction);
    }

    updatePosition(dt, collisionHelper) {
        axes.forEach((axis) => { // 'x'&'y' axis movement should be separated to prevent glitching at corners
            if (this.velocity[axis]) {
                this._tmp.origin = this.position[axis];
                
                this.position[axis] += this.velocity[axis] * dt; // move entity
                
                this._tmp.nearestBlockingAssets = collisionHelper.getNearestBlockingAssets(this);
                this._tmp.collidingAsset = this._tmp.nearestBlockingAssets.find((asset) => this.isInContact(asset));

                if (this._tmp.collidingAsset) {
                    this.position[axis] = this._tmp.origin; // reset move on collision
                    this.velocity[axis] = 0;

                    this.changeListener.dispatchEvent('collision', this._tmp.collidingAsset);
                }
            }
        });

        if (this.currentAction === 'walk' && !this.isMovingTowardsTarget()) {
            this.velocity.set(0, 0);
            this._originPosition.set(0, 0);
            this._targetPosition.set(0, 0);

            this.changeListener.dispatchEvent('targetReached');
        }
    }

    moveTo(targetPosition) {
        this._originPosition.copy(this.position);
        this._targetPosition.copy(targetPosition);
        this._tmp.previousAction = this.currentAction;
        this.currentAction = 'walk';

        this.velocity
            .copy(this._targetPosition)
            .subtract(this.position)
            .normalize()
            .scale(this.movementSpeed);

        this.changeListener.dispatchEvent('stateChange', this._tmp.previousAction, this.currentAction);
    }

    isMovingTowardsTarget() {
        return ((
            this._originPosition.x <= this._targetPosition.x 
            && this._originPosition.x <= this.position.x
            && this._targetPosition.x >= this.position.x
        ) || (
            this._originPosition.x >= this._targetPosition.x
            && this._originPosition.x >= this.position.x
            && this._targetPosition.x <= this.position.x
        )) && ((
            this._originPosition.y <= this._targetPosition.y
            && this._originPosition.y <= this.position.y
            && this._targetPosition.y >= this.position.y
        ) || (
            this._originPosition.y >= this._targetPosition.y
            && this._originPosition.y >= this.position.y
            && this._targetPosition.y <= this.position.y
        ));
    }

    isInContact(asset) {
        return this.boundingRect.top < asset.boundingRect.bottom
            && this.boundingRect.left < asset.boundingRect.right
            && this.boundingRect.right > asset.boundingRect.left
            && this.boundingRect.bottom > asset.boundingRect.top;
    }

    get direction() {
        _cacheIndex = `${this.velocity.x},${this.velocity.y}`;
        
        if (this.velocity.x === 0 && this.velocity.y === 0 && this._tmp.previousDirection) {
            return this._tmp.previousDirection;
        }
        if (_cache.direction[_cacheIndex]) {
            return _cache.direction[_cacheIndex];
        }

        this._tmp.angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI/8;
        if (this._tmp.angle < 0) {
            this._tmp.angle += 2*Math.PI;
        } else if (this._tmp.angle > 2*Math.PI) {
            this._tmp.angle -= 2*Math.PI;
        }

        return _cache.direction[_cacheIndex] = this._tmp.previousDirection = directions.find((dir, index) => {
            return this._tmp.angle >= index * Math.PI/4 && this._tmp.angle < (index + 1) * Math.PI/4;
        });
    }

    // action (Move | Attack) -> // target (Entity | Creature)
    _getStateChangeHandler() {
        let ignoreNextChange = false;
        const methodCallProxy = (target, propertyName, receiver) => {
            if (typeof target[propertyName] !== 'function') {
                return target[propertyName];
            }

            return function(...args) {
                if (propertyName === 'set') {
                    ignoreNextChange = true;
                }

                return target[propertyName].apply(this, args);
            };
        };
    
        return {
            set: (target, propertyName, value) => {
                target[propertyName] = value;

                if (ignoreNextChange) {
                    ignoreNextChange = false;
                } else {
                    this.changeListener.dispatchEvent('stateChange', this);
                }
        
                return true;
            },
            get: methodCallProxy, // http://2ality.com/2015/10/intercepting-method-calls.html
        };
    }
}
