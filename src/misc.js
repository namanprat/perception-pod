function misc()
{
    document.addEventListener("DOMContentLoaded", function () {
        // Register all necessary GSAP plugins at once
        gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin, Flip);
      
        // --- A. SET INITIAL STATE ---
        gsap.set("#nav", { yPercent: -100 });
        gsap.set(".hero-wordmark .hero-path", { yPercent: 100, opacity: 0 });
      
        // --- 1. PRELOADER (Refactored into a Timeline) ---
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
            delay: 1,
            yPercent: -100,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: {
              amount: 0.05
            }
          })
      
          .to(
            ".preloader_wrap", {
              yPercent: -100,
              delay: -0.25,
              duration: 0.8,
              ease: "power3.out"
            },
          );
      
        // HERO REVEAL
        const heroTl = gsap.timeline();
        heroTl
          .to(".hero-wordmark .hero-path", {
            delay: 3.7,
            opacity: 1,
            yPercent: 0,
            duration: 1,
            ease: "power2.inOut",
            stagger: 0.02
          }, "<")
          .from(".hero-nav-item", {
            delay: 0.3,
            yPercent: -120,
            duration: 1.2,
            ease: "power4.inOut",
            stagger: 0.1,
          }, "<");
      
        // --- 2. ABOUT REVEAL ---
        const contentTextEl = document.querySelector(".content_text");
        const revealWrapEl = document.querySelector(".reveal_wrap");
      
        if (contentTextEl && revealWrapEl) {
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
          gsap.to(".reveal_wrap", {
            backgroundColor: "rgba(249, 255, 244, 0)",
            scrollTrigger: {
              trigger: ".reveal_wrap",
              start: "top top",
              end: "bottom 50%",
              scrub: true
            }
          });
        }
      
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
      
        // --- 4. CARDS ---
        const isDesktop = !("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const cards = document.querySelectorAll(".card_wrap");
      
        cards.forEach((card) => {
          const cardInner = card.querySelector(".card_inner");
          const highlight = card.querySelector(".card-highlight");
          let isFlipped = false;
      
          gsap.set(card, { transformPerspective: 1000 });
      
          card.addEventListener("click", () => {
            isFlipped = !isFlipped;
            gsap.to(cardInner, {
              rotationY: isFlipped ? 180 : 0,
              duration: 0.7,
              ease: "power3.inOut",
              onStart: () => {
                if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.1 });
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
              leaveTween = gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                duration: 1,
                ease: "elastic.out(1, 0.75)"
              });
              if (highlight) gsap.to(highlight, { opacity: 0, duration: 0.3 });
            });
            card.addEventListener("mousemove", (e) => {
              if (gsap.isTweening(cardInner) || isFlipped) return;
              const rect = card.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              const targetRotateX = -((mouseY - rect.height / 2) / (rect.height / 2)) * 12;
              const targetRotateY = ((mouseX - rect.width / 2) / (rect.width / 2)) * 12;
      
              gsap.to(card, {
                rotationX: targetRotateX,
                rotationY: targetRotateY,
                scale: 1.05,
                duration: 0.6,
                ease: "power2.out"
              });
      
              if (highlight) {
                highlight.style.setProperty("--x", `${mouseX}px`);
                highlight.style.setProperty("--y", `${mouseY}px`);
                highlight.style.setProperty("--gx", `${(mouseX / rect.width) * 100}%`);
                highlight.style.setProperty("--gy", `${(mouseY / rect.height) * 100}%`);
              }
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
      
      }); // End of DOMContentLoaded
      
}
export default misc