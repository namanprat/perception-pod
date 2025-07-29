gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin, Flip);

function scrub() {
    const preloaderTl = gsap.timeline();
    preloaderTl
        .to(".preloader-wordmark", { opacity: 1, yPercent: 0, duration: 0.2 })
        .from(".preloader-wordmark .path", {
            delay: 0.2,
            opacity: 0,
            yPercent: 100,
            duration: 0.8,
            ease: "power3.out",
            stagger: {
                amount: 0.25
            }
        });
        
    const start = performance.now();
    
    // Generate image URLs array
    const imageUrls = [];
    for (let i = 1; i <= 100; i++) {
        imageUrls.push(`https://perception-pod.netlify.app/${i}.png`);
    }
    
    // Image sequence object with progress tracking
    const imageSequence = {
        frame: 0,
        images: [],
        imagesLoaded: 0,
        totalImages: imageUrls.length,
        loadingProgress: 0
    };
    
    // Custom image loader with progress tracking
    function loadImagesWithProgress() {
        let loadedCount = 0;
        let hasError = false;
        
        // Update progress bar
        function updateProgress() {
            const progress = loadedCount / imageSequence.totalImages;
            imageSequence.loadingProgress = progress;
            
            // console.log(`image ${loadedCount} out of ${imageSequence.totalImages} loaded (${Math.round(progress * 100)}%)`);
            
            // Animate progress bar - only if element exists
            const progressBar = document.querySelector(".progress-bar");
            if (progressBar) {
                gsap.to(progressBar, {
                    delay: 0.5,
                    scaleX: progress,
                    ease: "power3.out",
                });
            }
        }
        
        // Handle completion
        function onAllImagesLoaded() {
            const end = performance.now();
            // console.log(`Time taken to load ${imageSequence.totalImages} images: ${Math.round(end - start)}ms`);
            
            // Calculate remaining time to ensure loader is displayed for a minimum time
            const MIN_TIME = 1000;
            const duration = end - start;
            const remainingTime = Math.max(MIN_TIME - duration, 0);
            
            // Wait for minimum time + 500ms after progress completion, then start exit animations
            gsap.delayedCall((remainingTime / 1000) + 0.5, () => {
                // Fade out progress bar and play path exit animation simultaneously
                const progressBar = document.querySelector(".progress-bar");
                const preloaderPaths = document.querySelectorAll(".preloader-wordmark .path");
                const preloaderWrap = document.querySelector(".preloader_wrap");
                
                if (progressBar) {
                    gsap.to(progressBar, {
                        opacity: 0,
                        duration: 0.5,
                        ease: "power3.out"
                    });
                }
                
                // Play the exit animation for .path elements
                if (preloaderPaths.length > 0) {
                    gsap.to(preloaderPaths, {
                        yPercent: -100,
                        opacity: 0,
                        duration: 0.8,
                        ease: "power3.in",
                        stagger: {
                            amount: 0.12
                        },
                        onComplete: () => {
                            // Hide the entire preloader after path animation completes
                            if (preloaderWrap) {
                                gsap.to(preloaderWrap, {
                                    yPercent: -100,
                                    duration: 0.8,
                                    ease: "power3.out",
                                    onComplete: () => {
                                        // re-enable scrolling
                                        gsap.set("body", { overflow: "auto" });
                                        // Play hero reveal animation immediately when preloader exits
                                        if (typeof window.playHeroReveal === 'function') {
                                            window.playHeroReveal();
                                        }
                                    },
                                });
                            }
                        }
                    });
                } else {
                    // If no paths found, still complete the preloader sequence
                    if (preloaderWrap) {
                        gsap.to(preloaderWrap, {
                            yPercent: -100,
                            duration: 0.8,
                            ease: "power3.out",
                            onComplete: () => {
                                gsap.set("body", { overflow: "auto" });
                                if (typeof window.playHeroReveal === 'function') {
                                    window.playHeroReveal();
                                }
                            },
                        });
                    }
                }
            });
            
            // Initialize ScrollTrigger after loading is complete
            initScrollTrigger();
        }
        
        // Load each image with progress tracking
        imageUrls.forEach((url, index) => {
            const img = new Image();
            
            img.onload = () => {
                loadedCount++;
                imageSequence.imagesLoaded++;
                updateProgress();
                
                if (loadedCount === imageSequence.totalImages && !hasError) {
                    onAllImagesLoaded();
                }
            };
            
            img.onerror = () => {
                console.error(`Failed to load image: ${url}`);
                loadedCount++;
                updateProgress();
                hasError = true;
                
                if (loadedCount === imageSequence.totalImages) {
                    console.warn('Some images failed to load, but continuing...');
                    onAllImagesLoaded();
                }
            };
            
            img.src = url;
            imageSequence.images[index] = img;
        });
    }
    
    // Canvas setup with error handling
    let canvas = document.getElementById('pp-scrub');
    let ctx;
    
    // If canvas doesn't exist, create it dynamically
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'pp-scrub';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        
        const container = document.querySelector('.scrub_contain');
        if (container) {
            container.appendChild(canvas);
        } else {
            console.warn('Container .scrub_contain not found. Canvas may not be properly positioned.');
            document.body.appendChild(canvas);
        }
    }
    
    // Try to get context with fallback
    try {
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2d context');
        }
    } catch (error) {
        console.error('Canvas context error:', error);
        // Fallback: create new canvas element
        canvas = document.createElement('canvas');
        canvas.id = 'pp-scrub-fallback';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        
        const container = document.querySelector('.scrub_contain');
        if (container) {
            container.innerHTML = '';
            container.appendChild(canvas);
        }
        
        try {
            ctx = canvas.getContext('2d');
        } catch (fallbackError) {
            console.error('Fallback canvas creation failed:', fallbackError);
            return; // Exit if canvas is completely unavailable
        }
    }
    
    // Set canvas size with safety check
    function resizeCanvas() {
        if (canvas && ctx) {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Set actual size in memory (scaled to account for extra pixel density)
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            // Scale the drawing context so everything draws at the correct size
            ctx.scale(dpr, dpr);
            
            // Set display size (css pixels)
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resizeCanvas);
    } else {
        resizeCanvas();
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    // Draw current frame
    function drawFrame() {
        if (!canvas || !ctx) return;
        
        const currentFrame = Math.min(Math.floor(imageSequence.frame), imageSequence.totalImages - 1);
        const img = imageSequence.images[currentFrame];
        
        if (img && img.complete && img.naturalWidth > 0) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Get canvas display dimensions
            const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
            const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
            
            // Calculate scaling to cover entire frame height (like CSS object-fit: cover)
            const scale = Math.max(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
            const scaledWidth = img.naturalWidth * scale;
            const scaledHeight = img.naturalHeight * scale;
            
            // Center the image
            const x = (canvasWidth - scaledWidth) / 2;
            const y = (canvasHeight - scaledHeight) / 2;
            
            // Draw image
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // Create fade to transparent gradient for bottom 10vh
            const fadeHeight = canvasHeight * 0.1; // 10vh
            const fadeStartY = canvasHeight - fadeHeight;
            
            // Only apply fade if there's enough height
            if (fadeHeight > 0 && fadeStartY > 0) {
                // Create gradient from transparent to opaque black
                const gradient = ctx.createLinearGradient(0, fadeStartY, 0, canvasHeight);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at top of fade
                gradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Opaque black at bottom
                
                // Apply gradient as mask using composite operation
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, fadeStartY, canvasWidth, fadeHeight);
                
                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
            }
        }
    }
    
    // Initialize ScrollTrigger
    function initScrollTrigger() {
        // Draw initial frame
        drawFrame();
        
        const scrubWrap = document.querySelector(".scrub_wrap");
        if (!scrubWrap) {
            console.warn('.scrub_wrap element not found. ScrollTrigger may not work properly.');
            return;
        }
        
        // Create ScrollTrigger animation
        gsap.to(imageSequence, {
            frame: imageSequence.totalImages - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: scrubWrap,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.5,
                onUpdate: () => drawFrame()
            }
        });
    }
    
    // Start loading images with progress tracking
    loadImagesWithProgress();
    
    // Handle window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            drawFrame();
        }, 100);
    });
}

// --- SCROLL-BASED TOOLTIP REVEAL WITH TEXT ANIMATIONS ---
function initTooltipAnimations() {
    // Check if required elements exist
    const scrubContain = document.querySelector('.scrub_contain');
    if (!scrubContain) {
        console.warn('.scrub_contain not found. Tooltip animations may not work.');
        return;
    }
    
    // Initialize SplitText for all tooltip h2 and p elements with a Map for better tracking
    const splitTextMap = new Map();

    // Get all tooltip containers and initialize SplitText for each
    const tooltipContainers = gsap.utils.toArray('.tooltip_contain');
    
    if (tooltipContainers.length === 0) {
        console.warn('No .tooltip_contain elements found.');
        return;
    }

    tooltipContainers.forEach(container => {
        const h2 = container.querySelector('.tooltip-info h2');
        const p = container.querySelector('.tooltip-info p');
        
        if (h2) {
            try {
                const h2Split = new SplitText(h2, {type: "lines, words"});
                splitTextMap.set(h2, h2Split);
            } catch (error) {
                console.error('Error splitting h2 text:', error);
            }
        }
        
        if (p) {
            try {
                const pSplit = new SplitText(p, {type: "lines", linesClass: "line-container"});
                splitTextMap.set(p, pSplit);
            } catch (error) {
                console.error('Error splitting p text:', error);
            }
        }
    });

    // Set initial states for tooltip-info containers
    const tooltipInfos = document.querySelectorAll('.tooltip-info');
    if (tooltipInfos.length > 0) {
        gsap.set(tooltipInfos, { autoAlpha: 0 });
    }

    // Apply overflow hidden to line containers
    const lineContainers = document.querySelectorAll('.line-container');
    if (lineContainers.length > 0) {
        gsap.set(lineContainers, { overflow: 'hidden' });
    }

    // Set initial states for all words and lines
    Array.from(splitTextMap.values()).forEach(split => {
        if (split.words && split.words.length > 0) {
            gsap.set(split.words, { autoAlpha: 0, y: 100 });
        }
        if (split.lines && split.lines.length > 0) {
            gsap.set(split.lines, { autoAlpha: 0, y: 100 });
        }
    });

    const tooltipRevealTl = gsap.timeline({
        scrollTrigger: {
            trigger: scrubContain,
            start: "bottom 20%", 
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                
                // Animate tooltip containers to become visible
                const tooltipWraps = document.querySelectorAll(".tooltip_wrap");
                const tooltipContains = document.querySelectorAll(".tooltip_contain");
                
                if (tooltipWraps.length > 0) {
                    gsap.to(tooltipWraps, { autoAlpha: 1, duration: 0.1 });
                }
                if (tooltipContains.length > 0) {
                    gsap.to(tooltipContains, { autoAlpha: 1, duration: 0.1 });
                }
                
                // Calculate which tooltips should be animated based on progress
                const totalTooltips = tooltipContainers.length;
                const currentTooltipIndex = Math.floor(progress * totalTooltips);
                
                tooltipContainers.forEach((container, index) => {
                    if (index <= currentTooltipIndex) {
                        const tooltipInfo = container.querySelector('.tooltip-info');
                        const h2 = container.querySelector('.tooltip-info h2');
                        const p = container.querySelector('.tooltip-info p');
                        
                        if (!tooltipInfo) return;
                        
                        const h2Split = splitTextMap.get(h2);
                        const pSplit = splitTextMap.get(p);
                        
                        if ((h2Split || pSplit) && gsap.getProperty(tooltipInfo, "autoAlpha") === 0) {
                            // Create one-time animation for this tooltip
                            const tl = gsap.timeline();
                            
                            // First show the tooltip container
                            tl.to(tooltipInfo, {
                                autoAlpha: 1,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                            
                            // Then animate in the h2 text elements if they exist
                            if (h2Split && h2Split.words && h2Split.words.length > 0) {
                                tl.to(h2Split.words, {
                                    autoAlpha: 1,
                                    y: 0,
                                    duration: 0.6,
                                    stagger: 0.02,
                                    ease: "power2.out"
                                }, "-=0.1");
                            }
                            
                            // Then animate in the p text elements if they exist
                            if (pSplit && pSplit.lines && pSplit.lines.length > 0) {
                                tl.to(pSplit.lines, {
                                    autoAlpha: 1,
                                    y: 0,
                                    duration: 0.5,
                                    stagger: 0.1,
                                    ease: "power2.out"
                                }, "-=0.3");
                            }
                        }
                    }
                });
            }
        }
    });
}

// Initialize tooltip animations when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    // Set initial states for tooltips
    const tooltipWraps = document.querySelectorAll(".tooltip_wrap");
    const tooltipContains = document.querySelectorAll(".tooltip_contain");
    
    if (tooltipWraps.length > 0) {
        gsap.set(tooltipWraps, { autoAlpha: 0 });
    }
    if (tooltipContains.length > 0) {
        gsap.set(tooltipContains, { autoAlpha: 0 });
    }
    
    // Initialize tooltip animations
    initTooltipAnimations();
});

// Export functions
export { scrub, initTooltipAnimations };

// Add default export for compatibility
export default { scrub, initTooltipAnimations };