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

function misc() {
    document.addEventListener("DOMContentLoaded", function () {
        // DETECT TOUCH DEVICES FOR OPTIMIZATIONS
        const isDesktop = !("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        
        // INITIAL STATES
        gsap.set("#nav", { yPercent: -100 });
        gsap.set(".hero-wordmark .hero-path", { yPercent: 100, opacity: 0 });
        gsap.set(".hero-nav-item", { y: -100, opacity: 0 });
        
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
            type: "words",
            wordsClass: "u-overflow-hidden"
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
}

// Export functions
export { init as default, playHeroReveal, misc };