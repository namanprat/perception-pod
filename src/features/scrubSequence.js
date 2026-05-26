import { gsap } from '../runtime/gsapRuntime';
import { buildFrameUrls, resolveScrubConfig } from '../utils/scrubConfig';

function resolveRuntimeScrubConfig(container) {
    const runtimeConfig = window.PerceptionPodConfig?.scrub ?? {};
    const dataset = container?.dataset ?? {};

    return resolveScrubConfig({
        assetBaseUrl: dataset.assetBaseUrl ?? runtimeConfig.assetBaseUrl,
        extension: dataset.assetExtension ?? runtimeConfig.extension,
        firstFrame: dataset.firstFrame ?? runtimeConfig.firstFrame,
        frameCount: dataset.frameCount ?? runtimeConfig.frameCount,
        eagerCount: dataset.eagerCount ?? runtimeConfig.eagerCount,
        batchSize: dataset.batchSize ?? runtimeConfig.batchSize,
        minPreloaderMs: dataset.minPreloaderMs ?? runtimeConfig.minPreloaderMs,
        preloadRootMargin: dataset.preloadRootMargin ?? runtimeConfig.preloadRootMargin,
    });
}

function getNearestLoadedImage(images, targetIndex) {
    if (images[targetIndex]) {
        return images[targetIndex];
    }

    for (let offset = 1; offset < images.length; offset += 1) {
        const previousImage = images[targetIndex - offset];

        if (previousImage) {
            return previousImage;
        }

        const nextImage = images[targetIndex + offset];

        if (nextImage) {
            return nextImage;
        }
    }

    return null;
}

export function initScrubSequence({ onPreloaderComplete } = {}) {
    const scrubContain = document.querySelector('.scrub_contain');
    const scrubWrap = document.querySelector('.scrub_wrap');

    if (!scrubContain || !scrubWrap) {
        return () => {};
    }

    const config = resolveRuntimeScrubConfig(scrubContain);
    const imageUrls = buildFrameUrls(config);
    const imageSequence = {
        frame: 0,
        images: new Array(imageUrls.length).fill(null),
        loaded: new Set(),
        totalImages: imageUrls.length,
    };
    const cleanupCallbacks = [];
    const frameLoadPromises = new Map();
    const preloaderTimeline = gsap.timeline();
    const eagerLimit = Math.min(config.eagerCount, imageSequence.totalImages);
    let backgroundLoadingStarted = false;
    let scrollTween = null;
    let intersectionObserver = null;

    preloaderTimeline
        .to('.preloader-wordmark', { opacity: 1, yPercent: 0, duration: 0.2 })
        .from('.preloader-wordmark .path', {
            delay: 0.2,
            opacity: 0,
            yPercent: 100,
            duration: 0.8,
            ease: 'power3.out',
            stagger: {
                amount: 0.25,
            },
        });

    const existingCanvasNode = document.getElementById('pp-scrub');
    let canvas =
        existingCanvasNode instanceof HTMLCanvasElement
            ? existingCanvasNode
            : existingCanvasNode?.querySelector('canvas');

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = existingCanvasNode ? 'pp-scrub-canvas' : 'pp-scrub';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        if (existingCanvasNode) {
            existingCanvasNode.appendChild(canvas);
        } else {
            scrubContain.appendChild(canvas);
        }
    }

    let context = null;

    try {
        context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    } catch (error) {
        console.error('Canvas context error:', error);
        return () => {};
    }

    const resizeCanvas = () => {
        const rect = (existingCanvasNode ?? scrubContain).getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = () => {
        const targetFrame = Math.max(
            0,
            Math.min(Math.floor(imageSequence.frame), imageSequence.totalImages - 1)
        );
        const image = getNearestLoadedImage(imageSequence.images, targetFrame);

        if (!image) {
            return;
        }

        const canvasWidth = canvas.width / (Math.min(window.devicePixelRatio || 1, 1.5));
        const canvasHeight = canvas.height / (Math.min(window.devicePixelRatio || 1, 1.5));

        context.clearRect(0, 0, canvasWidth, canvasHeight);

        const scale = Math.max(
            canvasWidth / image.naturalWidth,
            canvasHeight / image.naturalHeight
        );
        const scaledWidth = image.naturalWidth * scale;
        const scaledHeight = image.naturalHeight * scale;
        const x = (canvasWidth - scaledWidth) / 2;
        const y = (canvasHeight - scaledHeight) / 2;

        context.drawImage(image, x, y, scaledWidth, scaledHeight);

        const fadeHeight = canvasHeight * 0.1;
        const fadeStartY = canvasHeight - fadeHeight;

        if (fadeHeight <= 0 || fadeStartY <= 0) {
            return;
        }

        const fadeGradient = context.createLinearGradient(0, fadeStartY, 0, canvasHeight);
        fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = fadeGradient;
        context.fillRect(0, fadeStartY, canvasWidth, fadeHeight);
        context.globalCompositeOperation = 'source-over';
    };

    const updateProgress = (loadedCount, totalCount) => {
        const progressElement = document.querySelector('#progress-number');

        if (!progressElement) {
            return;
        }

        const percentage = Math.round((loadedCount / Math.max(totalCount, 1)) * 100);
        progressElement.textContent = `[${percentage}%]`;
    };

    const loadFrame = (index) => {
        if (imageSequence.loaded.has(index)) {
            return Promise.resolve(imageSequence.images[index]);
        }

        if (frameLoadPromises.has(index)) {
            return frameLoadPromises.get(index);
        }

        const promise = new Promise((resolve) => {
            const image = new Image();

            image.onload = () => {
                imageSequence.images[index] = image;
                imageSequence.loaded.add(index);
                frameLoadPromises.delete(index);
                resolve(image);
            };

            image.onerror = () => {
                console.error(`Failed to load image: ${imageUrls[index]}`);
                frameLoadPromises.delete(index);
                resolve(null);
            };

            image.src = imageUrls[index];
        });

        frameLoadPromises.set(index, promise);
        return promise;
    };

    const loadFrameRange = async (indexes, progressCallback) => {
        let completedCount = 0;

        await Promise.all(
            indexes.map(async (index) => {
                await loadFrame(index);
                completedCount += 1;
                progressCallback?.(completedCount);
            })
        );
    };

    const initScrollTrigger = () => {
        drawFrame();

        if (scrollTween) {
            scrollTween.kill();
        }

        scrollTween = gsap.to(imageSequence, {
            frame: imageSequence.totalImages - 1,
            snap: 'frame',
            ease: 'none',
            scrollTrigger: {
                trigger: scrubWrap,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.5,
                onUpdate: () => drawFrame(),
            },
        });
    };

    const runPreloaderExit = (loadStartTime) => {
        const elapsedTime = performance.now() - loadStartTime;
        const remainingTime = Math.max(config.minPreloaderMs - elapsedTime, 0);

        gsap.delayedCall(remainingTime / 1000 + 0.25, () => {
            const progressBottom = document.querySelector('.progress-bottom');
            const preloaderHeading = document.querySelector('.preloader h4');

            if (progressBottom) {
                gsap.to(progressBottom, {
                    opacity: 0,
                    duration: 0.5,
                    ease: 'power3.out',
                });
            }

            if (preloaderHeading) {
                gsap.to(preloaderHeading, {
                    opacity: 0,
                    duration: 0.5,
                    ease: 'power3.out',
                });
            }

            gsap.to('.preloader-wordmark .path', {
                yPercent: -100,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.in',
                stagger: {
                    amount: 0.12,
                },
                onComplete: () => {
                    gsap.to('.preloader_wrap', {
                        yPercent: -100,
                        duration: 0.8,
                        ease: 'power3.out',
                        onComplete: () => {
                            gsap.set('body', { overflow: 'auto' });
                            onPreloaderComplete?.();
                        },
                    });
                },
            });
        });
    };

    const beginBackgroundLoading = async () => {
        if (backgroundLoadingStarted) {
            return;
        }

        backgroundLoadingStarted = true;

        for (
            let startIndex = eagerLimit;
            startIndex < imageSequence.totalImages;
            startIndex += config.batchSize
        ) {
            const indexes = Array.from(
                { length: Math.min(config.batchSize, imageSequence.totalImages - startIndex) },
                (_, offset) => startIndex + offset
            );

            // Yield between batches so the main thread stays responsive.
            await loadFrameRange(indexes);
            await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
    };

    const observeScrubVisibility = () => {
        if (!('IntersectionObserver' in window)) {
            beginBackgroundLoading();
            return;
        }

        intersectionObserver = new IntersectionObserver(
            (entries) => {
                const isVisible = entries.some((entry) => entry.isIntersecting);

                if (isVisible) {
                    beginBackgroundLoading();
                    intersectionObserver.disconnect();
                    intersectionObserver = null;
                }
            },
            {
                rootMargin: config.preloadRootMargin,
            }
        );

        intersectionObserver.observe(scrubWrap);
    };

    const handleResize = () => {
        resizeCanvas();
        drawFrame();
    };

    window.addEventListener('resize', handleResize);
    cleanupCallbacks.push(() => window.removeEventListener('resize', handleResize));

    resizeCanvas();
    observeScrubVisibility();

    const loadStartTime = performance.now();
    const eagerIndexes = Array.from({ length: eagerLimit }, (_, index) => index);

    loadFrameRange(eagerIndexes, (completedCount) => updateProgress(completedCount, eagerLimit)).then(() => {
        updateProgress(eagerLimit, eagerLimit);
        initScrollTrigger();
        runPreloaderExit(loadStartTime);
    });

    cleanupCallbacks.push(() => {
        intersectionObserver?.disconnect();
        scrollTween?.kill();
    });

    return () => {
        cleanupCallbacks.splice(0).forEach((cleanup) => cleanup());
    };
}
