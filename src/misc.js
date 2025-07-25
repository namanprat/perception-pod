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

// Set initial states
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

// Get all tooltip circles
const tooltipCircles = gsap.utils.toArray('.tooltip-circle');

// Add click event to each tooltip circle
tooltipCircles.forEach((circle, index) => {
  circle.addEventListener('click', () => {
    // Find the corresponding tooltip-info within the same tooltip_contain
    const container = circle.closest('.tooltip_contain');
    const tooltipInfo = container.querySelector('.tooltip-info');
    const h2 = container.querySelector('.tooltip-info h2');
    const p = container.querySelector('.tooltip-info p');
    
    // Get the split text instances for this specific tooltip
    const h2Split = splitTextMap.get(h2);
    const pSplit = splitTextMap.get(p);
    
    // Check if splits exist before proceeding
    if (!h2Split || !pSplit) {
      console.error('SplitText instances not found for elements:', h2, p);
      return;
    }
    
    // Create timeline
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
  });
});

// Optional: Add functionality to hide tooltips when clicking elsewhere
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tooltip_contain')) {
    // Hide all visible tooltips
    const visibleTooltips = gsap.utils.toArray('.tooltip-info').filter(tooltip => 
      gsap.getProperty(tooltip, "autoAlpha") > 0
    );
    
    visibleTooltips.forEach(tooltip => {
      const container = tooltip.closest('.tooltip_contain');
      const h2 = container.querySelector('.tooltip-info h2');
      const p = container.querySelector('.tooltip-info p');
      
      const h2Split = splitTextMap.get(h2);
      const pSplit = splitTextMap.get(p);
      
      // Check if splits exist before proceeding
      if (!h2Split || !pSplit) {
        console.error('SplitText instances not found for elements during hide:', h2, p);
        return;
      }
      
      gsap.to(h2Split.words, {
        autoAlpha: 0,
        y: 100,
        duration: 0.3,
        stagger: 0.01,
        ease: "power2.in"
      });
      
      gsap.to(pSplit.lines, {
        autoAlpha: 0,
        y: 100,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.in"
      });
      
      gsap.to(tooltip, {
        autoAlpha: 0,
        duration: 0.3,
        delay: 0.2,
        ease: "power2.in"
      });
    });
  }
});


    document.addEventListener("DOMContentLoaded", function () {
        // DETECT TOUCH DEVICES FOR OPTIMIZATIONS
        const isDesktop = !("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        
        // INITIAL STATES
        gsap.set("#nav", { yPercent: -100 });
        gsap.set(".hero-wordmark .hero-path", { yPercent: 100, opacity: 0 });
        gsap.set(".hero-nav-item", { y: -100, opacity: 0 });
        gsap.set(".tooltip_wrap", { autoAlpha: 0 });
        
        // --- MODIFIED: TOOLTIP REVEAL ON SCROLL ---
        // Set initial state for individual tooltips for the reveal animation
       gsap.set(".tooltip_contain", { autoAlpha: 0 });

const tooltipRevealTl = gsap.timeline({
    scrollTrigger: {
        trigger: ".scrub_contain",
        start: "bottom 20%", // Start when bottom of scrub_wrap is 200vh from viewport top
        // end: "bottom 200vh",   // End when bottom of scrub_wrap is 100vh from viewport top  
        scrub: true,
   //     markers: true, // Remove this after testing
    }
});

// Animate the main wrapper to become visible for the entire duration
tooltipRevealTl.to(".tooltip_wrap", { autoAlpha: 1 }, 0);
// Stagger the appearance of individual tooltips within the last 100vh
tooltipRevealTl.to(".tooltip_contain", {
    autoAlpha: 1,
    duration: 0.4,
    stagger: 1, // Reduced stagger for better distribution in 100vh
    ease: "none"
}, 0);
        
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
        if (isDesktop) {
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
        let bodyText = new SplitText("#body-reveal", {
            type: "words, lines",
            linesClass: "body-line-wrapper"
        });

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
            .from(bodyText.words, {
                yPercent: 100,
                stagger: 0.02,
                duration: 1.5,
                ease: "power4.inOut",
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

        // Card animations (optimized)
        const cards = document.querySelectorAll(".card_wrap");

        cards.forEach((card) => {
            const cardInner = card.querySelector(".card_inner");
            const highlight = card.querySelector(".card-highlight");
            const cardSubject = card.querySelector(".card-subject");
            let isFlipped = false;
            let animationId = null;
            let lastTime = 0;
            const throttleDelay = 16; // ~60fps

            gsap.set(card, { transformPerspective: 1000 });

            card.addEventListener("click", () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
                
                isFlipped = !isFlipped;
                gsap.to(cardInner, {
                    rotationY: isFlipped ? 180 : 0,
                    duration: 0.7,
                    ease: "power3.inOut",
                    onStart: () => {
                        if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.1 });
                        if (!isTouchDevice) {
                            gsap.to(card, {
                                rotationX: 0,
                                rotationY: 0,
                                duration: 0.7,
                                ease: "power3.inOut"
                            });
                        }
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
                        if (isDesktop && !isFlipped && highlight) {
                            if (card.matches(":hover")) {
                                gsap.to(highlight, { opacity: 1, duration: 0.2 });
                            }
                        }
                    }
                });
            });

            if (isDesktop) {
                let leaveTween = null;
                
                card.addEventListener("mouseenter", () => {
                    if (leaveTween) leaveTween.kill();
                    if (highlight && !isFlipped) {
                        gsap.to(highlight, { opacity: 1, duration: 0.2 });
                    }
                });
                
                card.addEventListener("mouseleave", () => {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                    
                    leaveTween = gsap.to(card, {
                        rotationX: 0,
                        rotationY: 0,
                        scale: 1,
                        duration: 1,
                        ease: "elastic.out(1, 0.75)"
                    });
                    
                    if (cardSubject) {
                        gsap.to(cardSubject, {
                            x: 0,
                            y: 0,
                            rotationX: 0,
                            rotationY: 0,
                            duration: 1,
                            ease: "elastic.out(1, 0.75)"
                        });
                    }
                    
                    if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.3 });
                });
                
                card.addEventListener("mousemove", (e) => {
                    if (gsap.isTweening(cardInner) || isTouchDevice) return;
                    
                    const now = performance.now();
                    if (now - lastTime < throttleDelay) return;
                    lastTime = now;
                    
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                    }
                    
                    animationId = requestAnimationFrame(() => {
                        const rect = card.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const mouseY = e.clientY - rect.top;
                        
                        const moveX = ((mouseX - rect.width / 2) / rect.width) * 20;
                        const moveY = ((mouseY - rect.height / 2) / rect.height) * 20;
                        
                        if (!isFlipped) {
                            const targetRotateX = -((mouseY - rect.height / 2) / (rect.height / 2)) * 12;
                            const targetRotateY = ((mouseX - rect.width / 2) / (rect.width / 2)) * 12;
                            
                            gsap.to(card, {
                                rotationX: targetRotateX,
                                rotationY: targetRotateY,
                                scale: 1.05,
                                duration: 0.6,
                                ease: "power2.out"
                            });
                        } else {
                            gsap.to(card, {
                                scale: 1.05,
                                duration: 0.6,
                                ease: "power2.out"
                            });
                        }
                        
                        if (cardSubject) {
                            gsap.to(cardSubject, {
                                x: moveX,
                                y: moveY,
                                rotationX: -moveY * 0.5,
                                rotationY: moveX * 0.5,
                                duration: 0.6,
                                ease: "power2.out"
                            });
                        }

                        if (highlight) {
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

        // Smooth scroll links
        const scrollLinks = document.querySelectorAll(".scroll-link");

        scrollLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetSelector = link.getAttribute('data-scroll-to');
                if (targetSelector && document.querySelector(targetSelector)) {
                    gsap.to(window, {
                        duration: 1.5,
                        scrollTo: targetSelector,
                        ease: "power2.inOut"
                    });
                } else {
                    console.warn(`Scroll-to target "${targetSelector}" not found.`);
                }
            });
        });
    });
}

// Initialize everything
function init() {
    misc(); // Initialize misc animations first
    scrub(); // Initialize scrub animations and preloader
}

// Export functions
export { init as default, playHeroReveal, scrub, misc };