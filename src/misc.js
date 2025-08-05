gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin, Flip);

// Global variable to store the split text instance
let headerSplitText = null;

// Global function to handle hero reveal animations
function playHeroReveal() {
    // Hero reveal timeline
    const heroRevealTl = gsap.timeline();
    
    // Animate hero wordmark paths (only in hero section)
    heroRevealTl.to(".hero-wordmark .hero-path", {
        yPercent: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        stagger: {
            amount: 0.3
        }
    });
    
    // Animate hero nav items from y:-100 with stagger
    heroRevealTl.to(".hero-nav-item", {
      delay: -0.5,
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1
    }, "-=0.8");
    
    // Animate the pre-split header text
    if (headerSplitText && headerSplitText.lines) {
        // Animate each line's words together
        headerSplitText.lines.forEach((line, index) => {
            const wordsInLine = headerSplitText.words.filter(word => line.contains(word));
            
            heroRevealTl.to(wordsInLine, {
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.05 // Small stagger within each line
            }, index * 0.1); // Stagger between lines
        });
    }
    
}

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
    for (let i = 0; i <= 114; i++) {
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
        
        // Update progress counter
        function updateProgress() {
            const progress = loadedCount / imageSequence.totalImages;
            imageSequence.loadingProgress = progress;
            
            // Update progress counter with box brackets
            const progressElement = document.querySelector("#progress-number");
            if (progressElement) {
                const percentage = Math.round(progress * 100);
                progressElement.textContent = `[${percentage}%]`;
            }
        }
        
        // Handle completion
        function onAllImagesLoaded() {
            const end = performance.now();
            
            // Calculate remaining time to ensure loader is displayed for a minimum time
            const MIN_TIME = 1000;
            const duration = end - start;
            const remainingTime = Math.max(MIN_TIME - duration, 0);
            
            // Wait for minimum time + 500ms after progress completion, then start exit animations
            gsap.delayedCall((remainingTime / 1000) + 0.5, () => {
                // Fade out .progress-bottom instead of progress counter
                const progressBottom = document.querySelector(".progress-bottom");
                const preloaderH4 = document.querySelector(".preloader h4");
                
                if (progressBottom) {
                    gsap.to(progressBottom, {
                        opacity: 0,
                        duration: 0.5,
                        ease: "power3.out"
                    });
                }
                
                if (preloaderH4) {
                    gsap.to(preloaderH4, {
                        opacity: 0,
                        duration: 0.5,
                        ease: "power3.out"
                    });
                }
                
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
                                playHeroReveal();
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

function misc() {
    
    // --- TOOLTIP SYSTEM WITH SPLITTEXT ---
    const revealedCircles = new Set();
    const tooltipCircles = gsap.utils.toArray('.tooltip-circle');
    
    // Get tooltip display elements
    const tooltipHeader = document.querySelector('#tooltip-header');
    const tooltipBody = document.querySelector('#tooltip-body');
    
    // Variables to store current SplitText instances and state
    let currentHeaderSplit = null;
    let currentBodySplit = null;
    let isHovering = false;
    let activeCircle = null;
    
    // Store original text content for restoration
    let originalHeaderText = '';
    let originalBodyText = '';
    
    // Initialize and store original content
    if (tooltipHeader) {
        originalHeaderText = tooltipHeader.textContent || tooltipHeader.innerText || '';
        gsap.set(tooltipHeader, { autoAlpha: 1, display: 'block' });
        
        // Only create SplitText if there's content
        if (originalHeaderText.trim()) {
            currentHeaderSplit = new SplitText(tooltipHeader, {
                type: "words",
                wordsClass: "tooltip-word"
            });
        }
    }
    
    if (tooltipBody) {
        originalBodyText = tooltipBody.textContent || tooltipBody.innerText || '';
        gsap.set(tooltipBody, { autoAlpha: 1, display: 'block' });
        
        // Only create SplitText if there's content
        if (originalBodyText.trim()) {
            currentBodySplit = new SplitText(tooltipBody, {
                type: "words",
                wordsClass: "tooltip-body-word"
            });
            
            // Wrap each word in a container with u-overflow-hidden class (same as body-reveal)
            currentBodySplit.words.forEach(word => {
                const wrapper = document.createElement('div');
                wrapper.className = 'u-overflow-hidden';
                wrapper.style.display = 'inline-block';
                word.parentNode.insertBefore(wrapper, word);
                wrapper.appendChild(word);
            });
            
            // Set initial state for body words (same as body-reveal)
            gsap.set(currentBodySplit.words, { autoAlpha: 1, y: 0 });
        }
    }

    // Enhanced function to update tooltip content with SplitText animations
    function updateTooltipContent(headerText, bodyText) {
        const tl = gsap.timeline();
        
        // Store references to old splits
        const oldHeaderSplit = currentHeaderSplit;
        const oldBodySplit = currentBodySplit;
        
        // Keep original animation speeds
        const animDuration = 0.4;
        const staggerAmount = 0.1;
        
        // Animate out the current text with stagger
        if (oldHeaderSplit && oldHeaderSplit.words && oldHeaderSplit.words.length > 0) {
            tl.to(oldHeaderSplit.words, {
               autoAlpha: 0,
                y: -50,
                duration: animDuration,
                stagger: { amount: staggerAmount, from: "end" },
                ease: "power2.in"
            });
        }
        
        if (oldBodySplit && oldBodySplit.words && oldBodySplit.words.length > 0) {
            tl.to(oldBodySplit.words, {
                autoAlpha: 0,
                y: -50,
                duration: animDuration,
                stagger: { amount: staggerAmount, from: "end" },
                ease: "power2.in"
            }, "-=0.15");
        }
        
        // Update content and recreate SplitText instances
        tl.add(() => {
            // Revert existing splits before updating content
            if (oldHeaderSplit) oldHeaderSplit.revert();
            if (oldBodySplit) oldBodySplit.revert();
            
            // Update the text content and create new splits
            if (tooltipHeader && headerText !== null && headerText !== undefined) {
                tooltipHeader.textContent = headerText;
                // Create new SplitText instance for words only
                currentHeaderSplit = new SplitText(tooltipHeader, {
                    type: "words",
                    wordsClass: "tooltip-word"
                });
                // Set initial state for new words
                if (currentHeaderSplit.words && currentHeaderSplit.words.length > 0) {
                    gsap.set(currentHeaderSplit.words, {
                        y: 15,
                        opacity: 0
                    });
                }
            }
            
            if (tooltipBody && bodyText !== null && bodyText !== undefined) {
                tooltipBody.textContent = bodyText;
                // Create new SplitText instance for words
                currentBodySplit = new SplitText(tooltipBody, {
                    type: "words",
                    wordsClass: "tooltip-body-word"
                });
                
                // Wrap each word in a container with u-overflow-hidden class (same as body-reveal)
                currentBodySplit.words.forEach(word => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'u-overflow-hidden';
                    wrapper.style.display = 'inline-block';
                    word.parentNode.insertBefore(wrapper, word);
                    wrapper.appendChild(word);
                });
                
                // Set initial state for body words (same as body-reveal)
                if (currentBodySplit.words && currentBodySplit.words.length > 0) {
                    gsap.set(currentBodySplit.words, {
                        autoAlpha: 0,
                        y: 100
                    });
                }
            }
            
            // Animate in the new text immediately after creation
            if (currentHeaderSplit && currentHeaderSplit.words && currentHeaderSplit.words.length > 0) {
                gsap.to(currentHeaderSplit.words, {
                 autoAlpha: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: { amount: 0.4 },
                        ease: "power3.out",
                });
            }
            
            // Animate in body words with same style as body-reveal
            if (currentBodySplit && currentBodySplit.words && currentBodySplit.words.length > 0) {
                gsap.to(currentBodySplit.words, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1.5,
                    stagger: {amount: 0.5},
                    ease: "power4.inOut"
                });
            }
        });
        
        return tl;
    }

    // Function to reset tooltip info to initial state
    function resetTooltipInfo() {
        // Revert any existing splits
        if (currentHeaderSplit) {
            currentHeaderSplit.revert();
            currentHeaderSplit = null;
        }
        if (currentBodySplit) {
            currentBodySplit.revert();
            currentBodySplit = null;
        }
        
        // Reset text content to original state and hide
        if (tooltipHeader) {
            tooltipHeader.textContent = originalHeaderText;
            gsap.set(tooltipHeader, { autoAlpha: 0 });
        }
        if (tooltipBody) {
            tooltipBody.textContent = originalBodyText;
            gsap.set(tooltipBody, { autoAlpha: 0 });
        }
        
        // Reset state
        isHovering = false;
        activeCircle = null;
    }

    // Function to restore original tooltip content with animation
    function restoreOriginalTooltip() {
        // Only restore if no active circle is set
        if (activeCircle) return;
        
        // Reset splits first
        if (currentHeaderSplit) {
            currentHeaderSplit.revert();
            currentHeaderSplit = null;
        }
        if (currentBodySplit) {
            currentBodySplit.revert();
            currentBodySplit = null;
        }
        
        // Restore original text content
        if (tooltipHeader && originalHeaderText.trim()) {
            tooltipHeader.textContent = originalHeaderText;
            gsap.set(tooltipHeader, { autoAlpha: 1 });
            
            // Recreate SplitText for original content
            currentHeaderSplit = new SplitText(tooltipHeader, {
                type: "words",
                wordsClass: "tooltip-word"
            });
            
            // Set initial state and animate in
            gsap.set(currentHeaderSplit.words, { autoAlpha: 0, y: 20 });
            gsap.to(currentHeaderSplit.words, {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                stagger: { amount: 0.3 },
                ease: "power3.out"
            });
        }
        
        if (tooltipBody && originalBodyText.trim()) {
            tooltipBody.textContent = originalBodyText;
            gsap.set(tooltipBody, { autoAlpha: 1 });
            
            // Recreate SplitText for original content
            currentBodySplit = new SplitText(tooltipBody, {
                type: "words",
                wordsClass: "tooltip-body-word"
            });
            
            // Wrap each word in overflow containers
            currentBodySplit.words.forEach(word => {
                const wrapper = document.createElement('div');
                wrapper.className = 'u-overflow-hidden';
                wrapper.style.display = 'inline-block';
                word.parentNode.insertBefore(wrapper, word);
                wrapper.appendChild(word);
            });
            
            // Set initial state and animate in
            gsap.set(currentBodySplit.words, { autoAlpha: 0, y: 100 });
            gsap.to(currentBodySplit.words, {
                autoAlpha: 1,
                y: 0,
                duration: 1.2,
                stagger: { amount: 0.4 },
                ease: "power4.inOut"
            });
        }
    }

    // Set initial states for tooltip circles
    gsap.set('.tooltip-circle', { autoAlpha: 0 });
    
    // Track if pulse animation has been added
    let pulseAnimationAdded = false;
    
    // Add radial pulse animation to tooltip circles
    function addRadialPulseToCircles() {
        if (pulseAnimationAdded) return; // Prevent multiple calls
        pulseAnimationAdded = true;
        
        tooltipCircles.forEach((circle) => {
            // Create pseudo element for radial pulse
            const pulseElement = document.createElement('div');
            pulseElement.className = 'tooltip-circle-pulse';
            
            // Style the pulse element with more visible styling
            Object.assign(pulseElement.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '120%',
                height: '120%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.1) 70%, transparent 100%)',
                border: '1px solid rgba(255,255,255,0.3)',
                transform: 'translate(-50%, -50%) scale(0.8)',
                pointerEvents: 'none',
                zIndex: '10',
                opacity: '0.8'
            });
            
            // Make sure parent has relative positioning and overflow visible
            circle.style.position = 'relative';
            circle.style.overflow = 'visible';
            
            // Add pulse element to circle
            circle.appendChild(pulseElement);
            
            // Create infinite pulse animation with more dramatic effect
            gsap.set(pulseElement, { scale: 0.8, opacity: 0.8 });
            gsap.to(pulseElement, {
                scale: 2.5,
                opacity: 0,
                duration: 2,
                ease: "power2.out",
                repeat: -1,
                repeatDelay: 1,
                yoyo: false
            });
            
            // Add a secondary pulse for more visual impact
            const pulseElement2 = pulseElement.cloneNode(true);
            pulseElement2.style.animationDelay = '1s';
            circle.appendChild(pulseElement2);
            
            gsap.set(pulseElement2, { scale: 0.8, opacity: 0.6 });
            gsap.to(pulseElement2, {
                scale: 2.2,
                opacity: 0,
                duration: 2,
                ease: "power2.out",
                repeat: -1,
                repeatDelay: 1,
                delay: 1,
                yoyo: false
            });
        });
    }

    // Scroll-triggered circle reveal animation
    const tooltipRevealTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scrub_contain",
            start: "bottom 20%", 
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                
                gsap.to(".tooltip_wrap", { autoAlpha: 1, duration: 0.1 });
                
                // Restore original tooltip content when entering scrub section
                if (progress > 0) {
                    restoreOriginalTooltip();
                }
                
                const totalTooltips = tooltipCircles.length;
                const currentTooltipIndex = Math.floor(progress * totalTooltips);
                
                tooltipCircles.forEach((circle, index) => {
                    if (index <= currentTooltipIndex) {
                        if (!revealedCircles.has(circle)) {
                            revealedCircles.add(circle);
                            
                            gsap.to(circle, {
                                autoAlpha: 1,
                                duration: 0.6,
                                ease: "back.out(1.7)"
                            });
                        }
                    }
                });
                
                // Add pulse animation to all revealed circles
                if (progress > 0.1) { // Only add pulse after some circles are visible
                    addRadialPulseToCircles();
                }
            },
            onLeaveBack: () => {
                // Reset tooltip wrap opacity when scrolling back to top with smoother, slower transition
                gsap.to(".tooltip_wrap", { 
                    autoAlpha: 0, 
                    duration: 0.8,
                    ease: "power3.out"
                });
                
                // Reset revealed circles set
                revealedCircles.clear();
                
                // Hide all circles
                gsap.set('.tooltip-circle', { autoAlpha: 0});
                
                // Reset pulse animation flag
                pulseAnimationAdded = false;
                
                // Reset tooltip info content and animations
                resetTooltipInfo();
            }
        }
    });

    // Add hover and click effects for tooltip circles
    tooltipCircles.forEach((circle, index) => {
        
        // Hover enter effect (visual only)
        circle.addEventListener('mouseenter', function() {
            // Visual hover effect (works on both desktop and mobile)
            gsap.to(this, {
                scale: 1.3,
                duration: 0.3,
                ease: "back.out(1.7)"
            });
            
            // Reduce opacity of other circles
            tooltipCircles.forEach(otherCircle => {
                if (otherCircle !== this) {
                    gsap.to(otherCircle, {
                        opacity: 0.5,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
        });
        
        // Hover leave effect (visual only)
        circle.addEventListener('mouseleave', function() {
            // Visual hover effect (works on both desktop and mobile)
            gsap.to(this, {
                scale: 1,
                duration: 0.4,
                ease: "elastic.out(1, 0.6)"
            });
            
            // Restore opacity of all circles
            gsap.to(tooltipCircles, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        });
        
        // Click event with data attributes
        circle.addEventListener('click', function(event) {
            // Set this circle as active
            activeCircle = this;
            
            // Remove visual active state from all circles
            tooltipCircles.forEach(c => c.classList.remove('tooltip-active'));
            
            // Add visual active state to clicked circle
            this.classList.add('tooltip-active');
            
            // Restore opacity of all circles
            gsap.to(tooltipCircles, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            });
            
            // Read data attributes from the clicked element
            const clickedHeaderData = this.getAttribute('data-header');
            const clickedBodyData = this.getAttribute('data-body');
            
            // Update the tooltip content with SplitText animation
            updateTooltipContent(
                clickedHeaderData || `Content ${index + 1}`, 
                clickedBodyData || `This is the main content for circle ${index + 1}. You clicked to activate this.`
            );
            
            // Scale animation on click
            gsap.to(this, {
                scale: 1.5,
                duration: 0.1,
                ease: "power2.out",
                yoyo: true,
                repeat: 1
            });
        });
    });

    // --- END OF TOOLTIP SYSTEM ---

    document.addEventListener("DOMContentLoaded", function () {
        // DETECT TOUCH DEVICES FOR OPTIMIZATIONS WITH BREAKPOINT
        const isDesktop = !("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        
        // Add breakpoint check - consider devices under 1024px as mobile/tablet
        const isMobileBreakpoint = window.innerWidth < 1024;
        const shouldUseTouchBehavior = isTouchDevice || isMobileBreakpoint;
        
        // INITIAL STATES
        gsap.set("#nav", { yPercent: -100 });
        gsap.set(".hero-wordmark .hero-path", { yPercent: 100, opacity: 0 });
        gsap.set(".hero-nav-item", { y: -100, opacity: 0 });
        gsap.set(".tooltip_wrap", { autoAlpha: 0 });
        
        const headerSplit = document.querySelector("#header-split");
        if (headerSplit) {
            headerSplitText = new SplitText("#header-split", {
                type: "lines, words",
                linesClass: "split-line"
            });
            
            gsap.set(headerSplitText.words, { 
                y: "105%" 
            });
            
        }

        const magneticElements = document.querySelectorAll('.is-magnetic');
        
        // --- DISABLE MAGNETIC EFFECT ON TOUCH DEVICES ---
        if (isDesktop && !isMobileBreakpoint) {
            magneticElements.forEach(elem => {
                elem.addEventListener('mousemove', (e) => {
                    const rect = elem.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;

                    gsap.to(elem, {
                        x: (x * 0.3),
                        y: (y * 0.3),
                        duration: 0.8,
                        ease: 'power4.out',
                    });
                });

                elem.addEventListener('mouseleave', () => {
                    gsap.to(elem, {
                        x: 0,
                        y: 0,
                        duration: 1.2,
                        ease: 'elastic.out(1, 0.6)',
                    });
                });
            });
        }
        
        // --- END OF MODIFICATION ---

        gsap.to(".hero_main_wrap", {
            scrollTrigger: {
                trigger: ".hero_main_wrap",
                start: "top top",
                end: "130vh top",
                scrub: true
            },
            autoAlpha: 0,
            ease: "none"
        });
        

        // About reveal animation
        const contentText = document.querySelector(".content_text");
        const revealWrap = document.querySelector(".reveal_wrap");

        if (contentText && revealWrap) {
            let text = new SplitText(".content_text", {
                type: "words"
            });
            gsap.from(text.words, {
                opacity: 0.2,
                stagger: 0.05,
                scrollTrigger: {
                    trigger: ".reveal_wrap",
                    start: "top 90%",
                    end: "bottom center",
                    scrub: true
                }
            });
        }

        // Header and body reveal animations
        let headerText = new SplitText("#header-reveal", {
            type: "words, lines", 
            linesClass: "header-line-wrapper"
        });
        
        // Body text with same approach as tooltip-info p
        let bodyText = new SplitText("#body-reveal", {
            type: "words",
            wordsClass: "word-container"
        });
        
        // Wrap each word in a container with u-overflow-hidden class (like tooltip-info p)
        // But we'll animate the words inside, not the wrapper
        bodyText.words.forEach(word => {
            const wrapper = document.createElement('div');
            wrapper.className = 'u-overflow-hidden';
            wrapper.style.display = 'inline-block'; // Make wrapper inline to preserve word flow
            word.parentNode.insertBefore(wrapper, word);
            wrapper.appendChild(word);
        });
        
        // Set initial state for body words (same as tooltip-info p lines)
        gsap.set(bodyText.words, { autoAlpha: 0, y: 100 });

        const revealTl = gsap.timeline({
            scrollTrigger: {
                trigger: "#header-reveal", 
                start: "top 75%", 
            }
        });
        revealTl
            .from(headerText.words, {
                yPercent: 105,
                opacity: 0,
                stagger: 0.05,
                duration: 1.5,
                ease: "power4.inOut",
            })
            .from('.blocker_wrap', {
                opacity: 0,
                duration: 1.5,
                ease: "power4.inOut",
            }, "<")
            // Animate the words inside the u-overflow-hidden containers
            .to(bodyText.words, {
                autoAlpha: 1,
                y: 0,
                duration: 1.5,
                stagger: {amount: 0.5},
                ease: "power4.inOut"
            }, "<");

        // Clock functionality
        const clockEl = document.getElementById("clock");
        if (clockEl) {
            const getTime = function () {
                clockEl.innerHTML = new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    timeStyle: "long",
                    hourCycle: "h24"
                });
            };
            getTime();
            setInterval(getTime, 1000);
        }
        const brevClock = document.getElementById("clock-2");
        if (brevClock) {
            const getTime = function () {
                brevClock.innerHTML = new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    timeStyle: "long",
                    hourCycle: "h24"
                });
            };
            getTime();
            setInterval(getTime, 1000);
        }

        // Card animations (FIXED FOR SAFARI SCALING ISSUES + AUTO-FLIP BACK)
        const cards = document.querySelectorAll(".card_wrap");
        let currentlyFlippedCard = null;

        // Function to flip back any currently flipped card
        function flipBackCurrentCard() {
            if (currentlyFlippedCard) {
                const cardInner = currentlyFlippedCard.querySelector(".card_inner");
                if (cardInner) {
                    gsap.to(cardInner, {
                        rotationY: 0,
                        duration: 0.7,
                        ease: "power3.inOut"
                    });
                    // Reset the flipped state
                    currentlyFlippedCard.isFlipped = false;
                    currentlyFlippedCard = null;
                }
            }
        }

        // Global click listener to flip back cards when clicking outside
        document.addEventListener('click', (e) => {
            // Check if the click was outside of any card
            const clickedCard = e.target.closest('.card_wrap');
            
            if (!clickedCard && currentlyFlippedCard) {
                // Clicked outside any card, flip back the current card
                flipBackCurrentCard();
            }
        });

        // Global escape key listener to flip back cards
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && currentlyFlippedCard) {
                flipBackCurrentCard();
            }
        });

        cards.forEach((card) => {
            const cardInner = card.querySelector(".card_inner");
            const highlight = card.querySelector(".card-highlight");
            const cardSubject = card.querySelector(".card-subject");
            let isFlipped = false;
            let animationId = null;
            let lastTime = 0;
            const throttleDelay = 16; // ~60fps
            
            // SAFARI FIX: Track hover state explicitly
            let isHovered = false;
            let mouseLeaveTimeout = null;
            let isAnimating = false; // Prevent multiple animations

            gsap.set(card, { 
                transformPerspective: 1000,
                // SAFARI FIX: Ensure initial transform values are set with no scale
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                // Force no scaling at all
                force3D: true
            });

            // SAFARI SCALE FIX: Override any potential scaling with direct CSS
            card.style.transform = 'scale(1)';
            card.style.webkitTransform = 'scale(1)';

            card.addEventListener("click", (e) => {
                // Prevent event from bubbling up to document click listener
                e.stopPropagation();
                
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
                
                // Prevent click during animation
                if (isAnimating) return;
                isAnimating = true;
                
                // If another card is currently flipped, reset it first
                if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                    const otherCardInner = currentlyFlippedCard.querySelector(".card_inner");
                    if (otherCardInner) {
                        gsap.to(otherCardInner, {
                            rotationY: 0,
                            duration: 0.7,
                            ease: "power3.inOut"
                        });
                        // Reset the flipped state of the other card
                        currentlyFlippedCard.isFlipped = false;
                    }
                }
                
                isFlipped = !isFlipped;
                
                // Update currently flipped card reference
                if (isFlipped) {
                    currentlyFlippedCard = card;
                    card.isFlipped = true;
                } else {
                    currentlyFlippedCard = null;
                    card.isFlipped = false;
                }
                
                gsap.to(cardInner, {
                    rotationY: isFlipped ? 180 : 0,
                    duration: 0.7,
                    ease: "power3.inOut",
                    onStart: () => {
                        if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.1 });
                        if (!shouldUseTouchBehavior) {
                            // SAFARI FIX: Explicitly reset all transform values with no scale
                            gsap.to(card, {
                                rotationX: 0,
                                rotationY: 0,
                                scale: 1, // Force scale to 1
                                duration: 0.7,
                                ease: "power3.inOut"
                            });
                        }
                        // SAFARI SCALE FIX: Force CSS transform to scale(1)
                        card.style.transform = 'scale(1)';
                        card.style.webkitTransform = 'scale(1)';
                        
                        if (highlight) {
                            gsap.set(highlight, {
                                "--mx": "50%",
                                "--my": "50%",
                                "--gx": "50%",
                                "--gy": "50%"
                            });
                        }
                    },
                    onComplete: () => {
                        isAnimating = false; // Allow new animations
                        // SAFARI FIX: Only show highlight if explicitly hovered and not flipped
                        if (isDesktop && !isFlipped && highlight && !isMobileBreakpoint && isHovered) {
                            gsap.to(highlight, { opacity: 1, duration: 0.2 });
                        }
                        // SAFARI SCALE FIX: Ensure scale stays at 1
                        card.style.transform = 'scale(1)';
                        card.style.webkitTransform = 'scale(1)';
                    }
                });
            });

            if (isDesktop && !isMobileBreakpoint) {
                let leaveTween = null;
                
                card.addEventListener("mouseenter", (e) => {
                    // SAFARI FIX: Verify this is a real mouseenter event
                    if (!card.contains(e.relatedTarget)) {
                        // Clear any existing timeout and set hover state
                        if (mouseLeaveTimeout) {
                            clearTimeout(mouseLeaveTimeout);
                            mouseLeaveTimeout = null;
                        }
                        isHovered = true;
                        
                        if (leaveTween) {
                            leaveTween.kill();
                            leaveTween = null;
                        }
                        
                        if (highlight && !isFlipped) {
                            gsap.to(highlight, { opacity: 1, duration: 0.2 });
                        }
                    }
                });
                
                card.addEventListener("mouseleave", (e) => {
                    // SAFARI FIX: Verify this is a real mouseleave event
                    if (!card.contains(e.relatedTarget)) {
                        // Use timeout to ensure mouse actually left
                        mouseLeaveTimeout = setTimeout(() => {
                            isHovered = false;
                            
                            if (animationId) {
                                cancelAnimationFrame(animationId);
                                animationId = null;
                            }
                            
                            // SAFARI FIX: More explicit reset with kill previous animations
                            leaveTween = gsap.to(card, {
                                rotationX: 0,
                                rotationY: 0,
                                scale: 1, // Explicitly set scale to 1
                                duration: 1,
                                ease: "elastic.out(1, 0.75)",
                                overwrite: true, // Kill any conflicting animations
                                onComplete: () => {
                                    // SAFARI SCALE FIX: Force CSS after animation
                                    card.style.transform = 'scale(1)';
                                    card.style.webkitTransform = 'scale(1)';
                                }
                            });
                            
                            if (cardSubject) {
                                gsap.to(cardSubject, {
                                    x: 0,
                                    y: 0,
                                    rotationX: 0,
                                    rotationY: 0,
                                    duration: 1,
                                    ease: "elastic.out(1, 0.75)",
                                    overwrite: true,
                                    onComplete: () => {
                                        // SAFARI SCALE FIX: Force CSS on card subject too
                                        cardSubject.style.transform = 'scale(1)';
                                        cardSubject.style.webkitTransform = 'scale(1)';
                                    }
                                });
                            }
                            
                            if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.3 });
                        }, 10); // Reduced delay
                    }
                });
                
                card.addEventListener("mousemove", (e) => {
                    // SAFARI FIX: Additional checks
                    if (gsap.isTweening(cardInner) || shouldUseTouchBehavior || isAnimating) return;
                    
                    // Verify mouse is actually over the card
                    const rect = card.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    // Check if mouse is within bounds
                    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
                        return;
                    }
                    
                    const now = performance.now();
                    if (now - lastTime < throttleDelay) return;
                    lastTime = now;
                    
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                    }
                    
                    animationId = requestAnimationFrame(() => {
                        const moveX = ((mouseX - rect.width / 2) / rect.width) * 20;
                        const moveY = ((mouseY - rect.height / 2) / rect.height) * 20;
                        
                        if (!isFlipped) {
                            const targetRotateX = -((mouseY - rect.height / 2) / (rect.height / 2)) * 12;
                            const targetRotateY = ((mouseX - rect.width / 2) / (rect.width / 2)) * 12;
                            
                            gsap.to(card, {
                                rotationX: targetRotateX,
                                rotationY: targetRotateY,
                                scale: 1, // SAFARI FIX: Force scale to always be 1
                                duration: 0.6,
                                ease: "power2.out",
                                overwrite: "auto", // Prevent conflicts
                                onUpdate: () => {
                                    // SAFARI SCALE FIX: Force CSS during animation
                                    card.style.transform = `rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale(1)`;
                                    card.style.webkitTransform = `rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale(1)`;
                                }
                            });
                        } else {
                            // SAFARI FIX: Even when flipped, ensure no scaling
                            gsap.to(card, {
                                scale: 1, // Force scale to 1
                                duration: 0.6,
                                ease: "power2.out",
                                overwrite: "auto",
                                onComplete: () => {
                                    // SAFARI SCALE FIX: Force CSS after animation
                                    card.style.transform = 'scale(1)';
                                    card.style.webkitTransform = 'scale(1)';
                                }
                            });
                        }
                        
                        if (cardSubject) {
                            gsap.to(cardSubject, {
                                x: moveX,
                                y: moveY,
                                rotationX: -moveY * 0.5,
                                rotationY: moveX * 0.5,
                                scale: 1, // SAFARI FIX: Force scale to 1 on subject too
                                duration: 0.6,
                                ease: "power2.out",
                                overwrite: "auto",
                                onComplete: () => {
                                    // SAFARI SCALE FIX: Force CSS on subject
                                    cardSubject.style.transform = `translateX(${moveX}px) translateY(${moveY}px) rotateX(${-moveY * 0.5}deg) rotateY(${moveX * 0.5}deg) scale(1)`;
                                    cardSubject.style.webkitTransform = `translateX(${moveX}px) translateY(${moveY}px) rotateX(${-moveY * 0.5}deg) rotateY(${moveX * 0.5}deg) scale(1)`;
                                }
                            });
                        }

                        if (highlight && isHovered) {
                            gsap.set(highlight, {
                                "--mx": `${mouseX}px`,
                                "--my": `${mouseY}px`,
                                "--gx": `${(mouseX / rect.width) * 100}%`,
                                "--gy": `${(mouseY / rect.height) * 100}%`
                            });
                        }
                        
                        animationId = null;
                    });
                });
            }
        });

        // Navigation show/hide based on scroll (original functionality)
        const showNavTimeline = gsap.timeline({ paused: true });
        showNavTimeline
            .to("#nav", { yPercent: 0, duration: 0.5, ease: "power2.out" })
            .fromTo(
                ".nav-item", {
                    opacity: 0,
                    y: 20
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    stagger: 0.1,
                    ease: "power2.out"
                },
                "-=0.3"
            );

        const hideNavTimeline = gsap.timeline({ paused: true });
        hideNavTimeline
            .to(".nav-item", {
                opacity: 0,
                y: 20,
                duration: 0.3,
                stagger: {
                    each: 0.05,
                    from: "end"
                },
                ease: "power2.in"
            })
            .to(
                "#nav", { yPercent: -100, duration: 0.4, ease: "power2.in" },
                "-=0.2"
            );

        // Navigation ScrollTrigger - separate from hero reveal
        ScrollTrigger.create({
            trigger: ".hero_contain",
            start: "bottom top",
            onEnter: () => showNavTimeline.restart(),
            onLeaveBack: () => hideNavTimeline.restart()
        });

        // --- FOOTER NAVIGATION HIDE/SHOW AND HERO-WORDMARK REVEAL ---
        // Check if footer exists
        const footer = document.querySelector('footer');
        
        if (footer) {
            // Get ALL .path elements in footer_wordmark (not just within footer)
            const footerWordmarkPaths = document.querySelectorAll('.footer-path');
            
            if (footerWordmarkPaths.length > 0) {
                // Set initial state - same as hero wordmark
                gsap.set(footerWordmarkPaths, { 
                    yPercent: 100, 
                    opacity: 0 
                });
            }

            // Create ScrollTrigger for footer navigation AND wordmark reveal
            ScrollTrigger.create({
                trigger: footer,
                start: "top 80%", // Trigger earlier
                end: "top 50%",
                id: "footer-animations",
                onEnter: () => {
                    // Hide navbar
                    hideNavTimeline.restart();
                    
                    // Reveal footer wordmark with same animation as hero
                    if (footerWordmarkPaths.length > 0) {
                        gsap.to(footerWordmarkPaths, {
                            yPercent: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: "power3.out",
                            stagger: {
                                amount: 0.3
                            }
                        });
                    }
                },
                onLeaveBack: () => {
                    // Show navbar
                    showNavTimeline.restart();
                    
                    // Hide footer wordmark
                    if (footerWordmarkPaths.length > 0) {
                        gsap.to(footerWordmarkPaths, {
                            yPercent: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: "power3.out",
                            stagger: {
                                amount: 0.3
                            }
                        });
                    }
                }
            });
        }
        // --- END OF FOOTER MODIFICATIONS ---

        // Hamburger menu flip animation
        document.querySelectorAll(".nav_wrap").forEach(function (navWrap) {
            const hamburgerEl = navWrap.querySelector(".nav_hamburger_wrap");
            const navLineEls = navWrap.querySelectorAll(".nav_hamburger_line");
            const menuContainEl = navWrap.querySelector(".menu_contain");
            const flipItemEl = navWrap.querySelector(".nav_hamburger_base");
            const menuWrapEl = navWrap.querySelector(".menu_wrap");
            const menuBaseEl = navWrap.querySelector(".menu_base");
            const menuLinkEls = navWrap.querySelectorAll(".menu_link");
            const flipDuration = 0.75;

            if (!hamburgerEl || !menuContainEl || !flipItemEl || !menuWrapEl || !menuBaseEl) {
                console.warn("GSAP Hamburger: One or more essential elements are missing.");
                return;
            }

            function flip(forwards) {
                let state = Flip.getState(flipItemEl);
                if (forwards) {
                    menuContainEl.appendChild(flipItemEl);
                } else {
                    hamburgerEl.appendChild(flipItemEl);
                }
                Flip.from(state, { duration: flipDuration, ease: "power3.inOut" });
            }

            let tl = gsap.timeline({ paused: true });
            tl.set(menuWrapEl, { display: "flex" });
            tl.from(menuBaseEl, {
                opacity: 0,
                duration: flipDuration,
                ease: "none",
                onStart: () => flip(true)
            });
            tl.to(navLineEls[0], { y: 4, rotate: 45, duration: flipDuration }, "<");
            tl.to(navLineEls[1], { y: -4, rotate: -45, duration: flipDuration }, "<");
            tl.from(menuLinkEls, {
                delay: -0.4,
                ease: "power3.inOut",
                y: '-100',
                duration: 2,
                stagger: 0.05,
                onReverseComplete: () => flip(false)
            }, "<");

            function openMenu(open) {
                if (!tl.isActive()) {
                    if (open) {
                        tl.play();
                        hamburgerEl.classList.add("nav-open");
                    } else {
                        tl.reverse();
                        hamburgerEl.classList.remove("nav-open");
                    }
                }
            }

            hamburgerEl.addEventListener("click", () => {
                openMenu(!hamburgerEl.classList.contains("nav-open"));
            });

            menuBaseEl.addEventListener("click", () => openMenu(false));

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && hamburgerEl.classList.contains("nav-open")) {
                    openMenu(false);
                }
            });
        });

        // FAQ Accordion functionality with SplitText animations
        const faqWrappers = document.querySelectorAll('.faq-wrapper');
        let activeFAQ = null; // Track currently active FAQ
        const faqSplitTexts = new Map(); // Store SplitText instances
        
        faqWrappers.forEach((wrapper, index) => {
            const arrow = wrapper.querySelector('.faq-arrow');
            const answerWrapper = wrapper.querySelector('.faq-answer-wrapper');
            
            if (!arrow || !answerWrapper) return;
            
            // Set initial state - answer wrapper hidden
            gsap.set(answerWrapper, { 
                height: 0, 
                overflow: 'hidden',
                autoAlpha: 1 // Keep it visible but collapsed
            });
            
            // Create SplitText for the answer content
            const answerText = answerWrapper.querySelector('p, .faq-answer-text, .answer-text');
            let splitTextInstance = null;
            
            if (answerText) {
                // Create SplitText instance
                splitTextInstance = new SplitText(answerText, {
                    type: "words",
                    wordsClass: "faq-word"
                });
                
                // Wrap each word in overflow containers (same style as tooltip and body-reveal)
                splitTextInstance.words.forEach(word => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'u-overflow-hidden';
                    wrapper.style.display = 'inline-block';
                    word.parentNode.insertBefore(wrapper, word);
                    wrapper.appendChild(word);
                });
                
                // Set initial state for words (same as body-reveal style)
                gsap.set(splitTextInstance.words, { 
                    autoAlpha: 0, 
                    y: 100 
                });
                
                // Store the SplitText instance
                faqSplitTexts.set(wrapper, splitTextInstance);
            }
            
            // Add click event to arrow
            arrow.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isCurrentlyActive = activeFAQ === wrapper;
                
                // Close currently active FAQ if there is one and it's different
                if (activeFAQ && activeFAQ !== wrapper) {
                    closeFAQ(activeFAQ);
                }
                
                // Toggle current FAQ
                if (isCurrentlyActive) {
                    closeFAQ(wrapper);
                    activeFAQ = null;
                } else {
                    openFAQ(wrapper);
                    activeFAQ = wrapper;
                }
            });
        });
        
        // Function to open FAQ
        function openFAQ(wrapper) {
            const arrow = wrapper.querySelector('.faq-arrow');
            const answerWrapper = wrapper.querySelector('.faq-answer-wrapper');
            const splitTextInstance = faqSplitTexts.get(wrapper);
            
            if (!answerWrapper) return;
            
            // Create timeline for opening animation
            const openTl = gsap.timeline();
            
            // Rotate arrow (if you want arrow rotation)
            if (arrow) {
                openTl.to(arrow, {
                    rotation: 180, // or 45, or whatever rotation you prefer
                    duration: 0.4,
                    ease: "power2.out"
                });
            }
            
            // Get the natural height by temporarily setting it to auto
            gsap.set(answerWrapper, { height: 'auto' });
            const naturalHeight = answerWrapper.offsetHeight;
            gsap.set(answerWrapper, { height: 0 });
            
            // Animate height to natural height
            openTl.to(answerWrapper, {
                height: naturalHeight,
                duration: 0.6,
                ease: "power3.out"
            }, arrow ? "-=0.2" : 0);
            
            // Animate SplitText words in (same style as body-reveal)
            if (splitTextInstance && splitTextInstance.words) {
                openTl.to(splitTextInstance.words, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1.2,
                    stagger: { amount: 0.4 },
                    ease: "power4.inOut"
                }, "-=0.3");
            }
            
            // Set height to auto after animation for responsive design
            openTl.set(answerWrapper, { height: 'auto' });
            
            // Add active class for styling
            wrapper.classList.add('faq-active');
        }
        
        // Function to close FAQ
        function closeFAQ(wrapper) {
            const arrow = wrapper.querySelector('.faq-arrow');
            const answerWrapper = wrapper.querySelector('.faq-answer-wrapper');
            const splitTextInstance = faqSplitTexts.get(wrapper);
            
            if (!answerWrapper) return;
            
            // Create timeline for closing animation
            const closeTl = gsap.timeline();
            
            // Get current height for smooth animation
            const currentHeight = answerWrapper.offsetHeight;
            gsap.set(answerWrapper, { height: currentHeight });
            
            // Animate SplitText words out first (faster exit)
            if (splitTextInstance && splitTextInstance.words) {
                closeTl.to(splitTextInstance.words, {
                    autoAlpha: 0,
                    y: -50, // Exit upward
                    duration: 0.4,
                    stagger: { amount: 0.1, from: "end" },
                    ease: "power2.in"
                });
            }
            
            // Animate height to 0
            closeTl.to(answerWrapper, {
                height: 0,
                duration: 0.5,
                ease: "power3.in"
            }, "-=0.2");
            
            // Rotate arrow back (if you want arrow rotation)
            if (arrow) {
                closeTl.to(arrow, {
                    rotation: 0,
                    duration: 0.4,
                    ease: "power2.out"
                }, "-=0.4");
            }
            
            // Remove active class
            wrapper.classList.remove('faq-active');
        }
        
        // Optional: Close FAQ when clicking outside (but not interfering with card clicks)
        document.addEventListener('click', (e) => {
            const clickedFAQ = e.target.closest('.faq-wrapper');
            const clickedCard = e.target.closest('.card_wrap');
            
            // Only close FAQ if not clicking on FAQ or card
            if (!clickedFAQ && !clickedCard && activeFAQ) {
                closeFAQ(activeFAQ);
                activeFAQ = null;
            }
        });
        
        // Optional: Close FAQ with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeFAQ) {
                closeFAQ(activeFAQ);
                activeFAQ = null;
            }
        });

        // FIXED: Smooth scroll links with proper data attribute handling + Footer wordmark scroll to top
        const scrollLinks = document.querySelectorAll(".scroll-link, #service-link, #about-link");
        const footerWordmark = document.querySelector(".footer_wordmark");

        scrollLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                let targetSelector = null;
                
                // Check for data-scroll-to attribute first
                if (link.hasAttribute('data-scroll-to')) {
                    targetSelector = link.getAttribute('data-scroll-to');
                }
                // Handle specific ID-based links
                else if (link.id === 'service-link') {
                    targetSelector = '#services';
                }
                else if (link.id === 'about-link') {
                    targetSelector = '#about';
                }
                // Fallback: check href attribute for hash links
                else if (link.href && link.href.includes('#')) {
                    targetSelector = link.href.split('#')[1];
                    if (targetSelector) {
                        targetSelector = '#' + targetSelector;
                    }
                }
                
                // Scroll to target if it exists
                if (targetSelector && document.querySelector(targetSelector)) {
                    gsap.to(window, {
                        duration: 1.5,
                        scrollTo: {
                            y: targetSelector,
                            offsetY: 0 // You can adjust this offset if needed
                        },
                        ease: "power2.inOut"
                    });
                } else {
                    console.warn(`Scroll-to target "${targetSelector}" not found.`);
                }
            });
        });

        // Footer wordmark click to scroll to top
        if (footerWordmark) {
            footerWordmark.addEventListener('click', (event) => {
                event.preventDefault();
                
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: {
                        y: 0, // Scroll to top
                        offsetY: 0
                    },
                    ease: "power2.inOut"
                });
            });
        }
    });
}

// ADDITIONAL SAFARI SCALE FIX: Completely prevent scaling with multiple methods
window.addEventListener('focus', () => {
    // Reset all cards to default state when window regains focus
    const allCards = document.querySelectorAll('.card_wrap');
    allCards.forEach(card => {
        // GSAP reset
        gsap.set(card, {
            rotationX: 0,
            rotationY: 0,
            scale: 1
        });
        
        // Direct CSS reset
        card.style.transform = 'scale(1)';
        card.style.webkitTransform = 'scale(1)';
        card.style.MozTransform = 'scale(1)';
        card.style.msTransform = 'scale(1)';
        card.style.OTransform = 'scale(1)';
        
        // Reset any child elements too
        const cardInner = card.querySelector('.card_inner');
        const cardSubject = card.querySelector('.card-subject');
        
        if (cardInner) {
            cardInner.style.transform = 'scale(1)';
            cardInner.style.webkitTransform = 'scale(1)';
        }
        
        if (cardSubject) {
            cardSubject.style.transform = 'scale(1)';
            cardSubject.style.webkitTransform = 'scale(1)';
        }
    });
});

// ADDITIONAL SAFARI SCALE FIX: Reset on page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Reset all cards when page becomes visible again
        const allCards = document.querySelectorAll('.card_wrap');
        allCards.forEach(card => {
            // GSAP reset
            gsap.set(card, {
                rotationX: 0,
                rotationY: 0,
                scale: 1
            });
            
            // Direct CSS reset
            card.style.transform = 'scale(1)';
            card.style.webkitTransform = 'scale(1)';
            card.style.MozTransform = 'scale(1)';
            card.style.msTransform = 'scale(1)';
            card.style.OTransform = 'scale(1)';
            
            // Reset child elements
            const cardInner = card.querySelector('.card_inner');
            const cardSubject = card.querySelector('.card-subject');
            
            if (cardInner) {
                cardInner.style.transform = 'scale(1)';
                cardInner.style.webkitTransform = 'scale(1)';
            }
            
            if (cardSubject) {
                cardSubject.style.transform = 'scale(1)';
                cardSubject.style.webkitTransform = 'scale(1)';
            }
        });
    }
});

// SAFARI SCALE FIX: Periodic cleanup to ensure no scaling occurs
setInterval(() => {
    const allCards = document.querySelectorAll('.card_wrap');
    allCards.forEach(card => {
        // Check if card has any unwanted scaling
        const computedStyle = window.getComputedStyle(card);
        const transform = computedStyle.transform || computedStyle.webkitTransform;
        
        // If transform contains scale other than 1, force it back to 1
        if (transform && transform.includes('scale') && !transform.includes('scale(1)')) {
            card.style.transform = 'scale(1)';
            card.style.webkitTransform = 'scale(1)';
        }
    });
}, 100); // Check every 100ms

// Initialize everything
function init() {
    misc(); // Initialize misc animations first
    scrub(); // Initialize scrub animations and preloader
}

export { init as default, playHeroReveal, scrub, misc };