export default {
    loadImage,
    debounce,
    throttle,
};

/**
 * Async image loader
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = (e) => resolve(image);
        image.onerror = (e) => {
            console.error(`can not load image: ${e.target.src}`);

            reject(image);
        };

        image.src = url;
    });
}

/**
 * 
 * @param {Function} fnc 
 * @param {number} delay 
 * @param {boolean} immediate 
 */
function debounce(fnc, delay = 200, immediate = false) {
    let timeoutId;

    return (...args) => {
        if (immediate && !timeoutId) {
            fnc(...args);
        }
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fnc(...args), delay);
    };
};

/**
 * 
 * @param {Function} fnc 
 * @param {number} timeToWaitBeforeNextCall 
 */
function throttle(fnc, timeToWaitBeforeNextCall = 200) {
    let timeoutId;
    let prevCallTime;
    let timeStamp;
    let nextScheduledCallTime;

    return (...args) => {
        nextScheduledCallTime = prevCallTime + timeToWaitBeforeNextCall;
        timeStamp = performance.now();

        if (!prevCallTime || timeStamp > nextScheduledCallTime) {
            fnc(...args);
            prevCallTime = timeStamp;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fnc(...args);
                prevCallTime = timeStamp;
            }, timeToWaitBeforeNextCall - (timeStamp - prevCallTime));
        }
    };
};
