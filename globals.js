/**
 * returns the value if it is within limits, else returns the limit that is closer to the value
 * @param {number} val value
 * @param {number} min lowest possible value
 * @param {number} max highest possible value
 * @returns {number}
 */
Math.valBetween = function(val, min, max) {
    return (Math.max(min, Math.min(val, max)));
};

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x = 0, y = 0) {
        this.x = x;
        this.y = y;

        return this;
    }

    normalize() {
        return this.scale(1 / (this.length || 1));
    }

    scale(scalar) {
		return this.set(this.x * scalar, this.y * scalar);
    }

    subtract(vector) {
        return this.set(this.x - vector.x, this.y - vector.y);
    }

    copy(vector) {
        return this.set(vector.x, vector.y);
    }

    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}

class Listener {
    constructor() {
        this.listeners = {};
    }

    addListener(event, listener) {
        if (typeof event !== 'string' || typeof listener !== 'function') {
            throw new TypeError('expected type of arguments are: <event: string, listener: Function>');
        }

        if (this.listeners[event]) {
            this.listeners[event].add(listener);
        } else {
            this.listeners[event] = new Set([listener]);
        }
    }

    removeListener(event, listener) {
        if (this.listeners[event]) {
            this.listeners[event].delete(listener);
        }
    }

    dispatchEvent(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((listener) => listener(...args));
        }
    }
}
