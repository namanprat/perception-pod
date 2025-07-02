function misc()
{
    document.addEventListener("DOMContentLoaded", function () {
        gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin, Flip);
      
        gsap.set("#nav", { yPercent: -100 });
        gsap.set(".hero-wordmark .hero-path", { yPercent: 100, opacity: 0 });


         const magneticElements = document.querySelectorAll('.is-magnetic');

    const strength = 50;

    magneticElements.forEach(elem => {
        elem.addEventListener('mousemove', (e) => {
            const rect = elem.getBoundingClientRect(); // Get the position of the element
            const x = e.clientX - rect.left - rect.width / 2; // Get mouse position relative to the element's center
            const y = e.clientY - rect.top - rect.height / 2;

            // Use GSAP to animate the element's position
            // We multiply the x and y by a factor (e.g., 0.3) to make the movement subtle.
            gsap.to(elem, {
                x: (x * 0.3),
                y: (y * 0.3),
                duration: 0.8, // A longer duration makes the movement smoother
                ease: 'power4.out', // A nice easing function
            });
        });

        elem.addEventListener('mouseleave', () => {
            gsap.to(elem, {
                x: 0,
                y: 0,
                duration: 1.2, // A bit longer to feel like a slow release
                ease: 'elastic.out(1, 0.6)', // A bouncy, elastic return
            });
        });
    });

      
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
          }).to(".preloader-wordmark .path", {
            delay: 0,
            yPercent: -100,
            opacity: 0,
            duration: 0.8,
            ease: "power3.in",
            stagger: {
              amount: 0.12
            }
          })
      
          .to(
            ".preloader_wrap", {
              yPercent: -100,
              duration: 0.8,
              ease: "power3.out"
            },
          );
      
        // HERO REVEAL      
        let headerSplit = new SplitText("#header-split", {
          type: "words, lines", // Split into both lines and words
          linesClass: "hero-line-wrapper"
        });
        
        const heroTl = gsap.timeline();
        heroTl
          .to(".hero-wordmark .hero-path", {
              delay: 2.35,
              opacity: 1,
              yPercent: 0,
              duration: 1,
              ease: "power2.inOut",
              stagger: 0.02
          }, "<")
          .from(".hero-nav-item", {
              delay: 0.3,
              yPercent: -120,
              duration: 1.25,
              ease: "power4.inOut",
              stagger: 0.1,
          }, "<")
          // The animation target is still the words, which is correct!
          .from(headerSplit.words, {
              yPercent: 100,
              duration: 1.25,
              stagger: 0.02,
              ease: "power4.inOut",
          }, "<");
      
        // --- 2. ABOUT REVEAL ---
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


// --- SETUP ---
let headerText = new SplitText("#header-reveal", {
   type: "words, lines", 
          linesClass: "header-line-wrapper"
});
let bodyText = new SplitText("#body-reveal", {
     type: "words, lines", // Split into both lines and words
          linesClass: "body-line-wrapper"
});

// --- TIMELINE AND SCROLLTRIGGER ---
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


    
        // --- 3. CLOCK ---
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
      
        // --- 4. CARDS (OPTIMIZED) ---
        const isDesktop = !("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
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
            // Cancel any pending animation frame
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
                // Reset card parallax rotation only (keep scale)
                if (!isTouchDevice) {
                  gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.7,
                    ease: "power3.inOut"
                  });
                }
                // Reset highlight position to center
                if (highlight) {
                  gsap.set(highlight, {
                    "--x": "50%",
                    "--y": "50%",
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
              // Cancel any pending animation frame
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
              
              // Reset card_subject position and rotation
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
              
              // Cancel previous animation frame if it exists
              if (animationId) {
                cancelAnimationFrame(animationId);
              }
              
              animationId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate movement multipliers for depth effect
                const moveX = ((mouseX - rect.width / 2) / rect.width) * 20;
                const moveY = ((mouseY - rect.height / 2) / rect.height) * 20;
                
                // Always apply scale, but only apply rotation if not flipped
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
                  // When flipped, only apply scale
                  gsap.to(card, {
                    scale: 1.05,
                    duration: 0.6,
                    ease: "power2.out"
                  });
                }
                
                // Animate card_subject for 3D depth effect (works on both sides)
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
                  // Use GSAP's set method for better performance
                  gsap.set(highlight, {
                    "--x": `${mouseX}px`,
                    "--y": `${mouseY}px`,
                    "--gx": `${(mouseX / rect.width) * 100}%`,
                    "--gy": `${(mouseY / rect.height) * 100}%`
                  });
                }
                
                animationId = null;
              });
            });
          }
        });
      
        // --- 5. NAVIGATION ANIMATION ---
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
      
        ScrollTrigger.create({
          trigger: ".hero_contain",
          start: "bottom top",
          onEnter: () => showNavTimeline.restart(),
          onLeaveBack: () => hideNavTimeline.restart()
        });
      
        // --- 6. HAMBURGER MENU FLIP ---
        document.querySelectorAll(".nav_wrap").forEach(function (navWrap) {
          const hamburgerEl = navWrap.querySelector(".nav_hamburger_wrap");
          const navLineEls = navWrap.querySelectorAll(".nav_hamburger_line");
          const menuContainEl = navWrap.querySelector(".menu_contain");
          const flipItemEl = navWrap.querySelector(".nav_hamburger_base");
          const menuWrapEl = navWrap.querySelector(".menu_wrap");
          const menuBaseEl = navWrap.querySelector(".menu_base");
          const menuLinkEls = navWrap.querySelectorAll(".menu_link");
          const flipDuration = 0.6;
      
          // Check if all essential elements exist before proceeding
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
            opacity: 0,
            yPercent: 100,
            duration: 0.35,
            stagger: { amount: 0.2 },
            onReverseComplete: () => flip(false)
          });
      
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
      
        // --- 7. SCROLL-TO LINKS (Refactored) ---
        // To use this, add class="scroll-link" and data-scroll-to=".target-selector"
        // to your <a> tags in the HTML.
        // Example: <a href="#" class="scroll-link" data-scroll-to=".about_wrap">About</a>
      
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
export default misc