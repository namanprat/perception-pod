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
            
            // Animate progress bar
            gsap.to(".progress-bar", {
                delay: 0.5,
                scaleX: progress,
                ease: "power3.out",
            });
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
                gsap.to(".progress-bar", {
                    opacity: 0,
                    duration: 0.5,
                    ease: "power3.out"
                });
                
                // Play the exit animation for .path elements
                gsap.to(".preloader-wordmark .path", {
                    yPercent: -100,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.in",
                    stagger: {
                        amount: 0.12
                    },
                    onComplete: () => {
                        // Hide the entire preloader after path animation completes
                        gsap.to(".preloader_wrap", {
                            yPercent: -100,
                            duration: 0.8,
                            ease: "power3.out",
                            onComplete: () => {
                                // re-enable scrolling
                                gsap.set("body", { overflow: "auto" });
                                // Play hero reveal animation immediately when preloader exits
                                if (typeof playHeroReveal === 'function') {
                                    playHeroReveal();
                                }
                            },
                        });
                    }
                });
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
    
    // If canvas doesn't exist, create it dynamically
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'pp-scrub';
        const container = document.querySelector('.scrub_contain');
        if (container) {
            container.appendChild(canvas);
        }
    }
    
    // Try to get context with fallback
    let ctx;
    try {
        ctx = canvas.getContext('2d');
    } catch (error) {
        console.error('Canvas context error:', error);
        // Fallback: create new canvas element
        canvas = document.createElement('canvas');
        canvas.id = 'pp-scrub';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        
        const container = document.querySelector('.scrub_contain');
        if (container) {
            container.innerHTML = '';
            container.appendChild(canvas);
        }
        
        ctx = canvas.getContext('2d');
    }
    
    // Set canvas size with safety check
    function resizeCanvas() {
        if (canvas && ctx) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
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
        const currentFrame = Math.floor(imageSequence.frame);
        const img = imageSequence.images[currentFrame];
        
        if (img && img.complete && ctx) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calculate scaling to cover entire frame height (like CSS object-fit: cover)
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Center the image
            const x = (canvas.width - scaledWidth) / 2;
            const y = (canvas.height - scaledHeight) / 2;
            
            // Draw image
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // Create fade to transparent gradient for bottom 10vh
            const fadeHeight = canvas.height * 0.1; // 10vh
            const fadeStartY = canvas.height - fadeHeight;
            
            // Create gradient from transparent to opaque black
            const gradient = ctx.createLinearGradient(0, fadeStartY, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at top of fade
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Opaque black at bottom
            
            // Apply gradient as mask using composite operation
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = gradient;
            ctx.fillRect(0, fadeStartY, canvas.width, fadeHeight);
            
            // Reset composite operation
            ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    // Initialize ScrollTrigger
    function initScrollTrigger() {
        // Draw initial frame
        drawFrame();
        
        // Create ScrollTrigger animation
        gsap.to(imageSequence, {
            frame: imageSequence.totalImages - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: ".scrub_wrap",
                start: "top top",
                end: "bottom bottom",
                scrub: 0.5,
                onUpdate: () => drawFrame()
            }
        });
        
    }
    
    // Start loading images with progress tracking
    loadImagesWithProgress();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        drawFrame();
    });
}

// --- SCROLL-BASED TOOLTIP REVEAL WITH TEXT ANIMATIONS ---
function initTooltipAnimations() {
    // Initialize SplitText for all tooltip h2 and p elements with a Map for better tracking
    const splitTextMap = new Map();

    // Get all tooltip containers and initialize SplitText for each
    const tooltipContainers = gsap.utils.toArray('.tooltip_contain');

    tooltipContainers.forEach(container => {
      const h2 = container.querySelector('.tooltip-info h2');
      const p = container.querySelector('.tooltip-info p');
      
      if (h2) {
        const h2Split = new SplitText(h2, {type: "lines, words"});
        splitTextMap.set(h2, h2Split);
      }
      
      if (p) {
        const pSplit = new SplitText(p, {type: "lines", linesClass: "line-container"});
        splitTextMap.set(p, pSplit);
      }
    });

    // Set initial states for tooltip-info containers
    gsap.set('.tooltip-info', { autoAlpha: 0 });

    // Apply overflow hidden to line containers
    gsap.set('.line-container', { overflow: 'hidden' });

    // Set initial states for all words and lines
    Array.from(splitTextMap.values()).forEach(split => {
      if (split.words) {
        gsap.set(split.words, { autoAlpha: 0, y: 100 });
      }
      if (split.lines) {
        gsap.set(split.lines, { autoAlpha: 0, y: 100 });
      }
    });

    const tooltipRevealTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scrub_contain",
            start: "bottom 20%", 
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                
                // Animate tooltip containers to become visible
                gsap.to(".tooltip_wrap", { autoAlpha: 1, duration: 0.1 });
                gsap.to(".tooltip_contain", { autoAlpha: 1, duration: 0.1 });
                
                // Calculate which tooltips should be animated based on progress
                const totalTooltips = tooltipContainers.length;
                const currentTooltipIndex = Math.floor(progress * totalTooltips);
                
                tooltipContainers.forEach((container, index) => {
                    if (index <= currentTooltipIndex) {
                        const tooltipInfo = container.querySelector('.tooltip-info');
                        const h2 = container.querySelector('.tooltip-info h2');
                        const p = container.querySelector('.tooltip-info p');
                        
                        const h2Split = splitTextMap.get(h2);
                        const pSplit = splitTextMap.get(p);
                        
                        if (h2Split && pSplit && gsap.getProperty(tooltipInfo, "autoAlpha") === 0) {
                            // Create one-time animation for this tooltip
                            const tl = gsap.timeline();
                            
                            // First show the tooltip container
                            tl.to(tooltipInfo, {
                                autoAlpha: 1,
                                duration: 0.3,
                                ease: "power2.out"
                            })
                            // Then animate in the text elements
                            .to(h2Split.words, {
                                autoAlpha: 1,
                                y: 0,
                                duration: 0.6,
                                stagger: 0.02,
                                ease: "power2.out"
                            }, "-=0.1")
                            .to(pSplit.lines, {
                                autoAlpha: 1,
                                y: 0,
                                duration: 0.5,
                                stagger: 0.1,
                                ease: "power2.out"
                            }, "-=0.3");
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
    gsap.set(".tooltip_wrap", { autoAlpha: 0 });
    gsap.set(".tooltip_contain", { autoAlpha: 0 });
    
    // Initialize tooltip animations
    initTooltipAnimations();
});

// Export functions
export { scrub, initTooltipAnimations };