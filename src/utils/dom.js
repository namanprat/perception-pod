export function onDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
}

export function query(selector, root = document) {
    return root.querySelector(selector);
}

export function queryAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export function hasAnySelector(selectors, root = document) {
    return selectors.some((selector) => Boolean(query(selector, root)));
}

export function createCleanupRegistry() {
    const callbacks = [];

    return {
        add(callback) {
            if (typeof callback === 'function') {
                callbacks.push(callback);
            }

            return callback;
        },
        run() {
            while (callbacks.length > 0) {
                const callback = callbacks.pop();

                try {
                    callback?.();
                } catch (error) {
                    console.error('Cleanup callback failed.', error);
                }
            }
        },
    };
}

export function rafThrottle(callback) {
    let frameId = null;
    let latestArgs = [];

    return (...args) => {
        latestArgs = args;

        if (frameId !== null) {
            return;
        }

        frameId = window.requestAnimationFrame(() => {
            frameId = null;
            callback(...latestArgs);
        });
    };
}
