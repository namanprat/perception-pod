import { initCardInteractions, initCardRecoveryHandlers } from './features/cardInteractions';
import { initClocks } from './features/clocks';
import { initFaqAccordions } from './features/faq';
import { initScrubSequence } from './features/scrubSequence';
import { initSmoothScrollLinks } from './features/scrollLinks';
import { initTooltipSystem } from './features/tooltipSystem';
import { Flip, getSplitText, gsap, ScrollTrigger } from './runtime/gsapRuntime';
import { createCleanupRegistry } from './utils/dom';

let headerSplitText = null;

function createSplitText(target, options) {
    const SplitText = getSplitText();

    if (!SplitText || !target) {
        return null;
    }

    try {
        return new SplitText(target, options);
    } catch (error) {
        console.error('SplitText failed to initialize.', error);
        return null;
    }
}

function wrapWords(words) {
    words.forEach((word) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'u-overflow-hidden';
        wrapper.style.display = 'inline-block';
        word.parentNode.insertBefore(wrapper, word);
        wrapper.appendChild(word);
    });
}

function playHeroReveal() {
    const heroRevealTimeline = gsap.timeline();

    heroRevealTimeline.to('.hero-wordmark .hero-path', {
        yPercent: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power3.out',
        stagger: {
            amount: 0.3,
        },
    });

    heroRevealTimeline.to(
        '.hero-nav-item',
        {
            delay: -0.5,
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.1,
        },
        '-=0.8'
    );

    if (headerSplitText?.lines) {
        headerSplitText.lines.forEach((line, index) => {
            const wordsInLine = headerSplitText.words.filter((word) => line.contains(word));

            heroRevealTimeline.to(
                wordsInLine,
                {
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    stagger: 0.05,
                },
                index * 0.1
            );
        });
    }
}

function initMagneticElements(isDesktop, isMobileBreakpoint) {
    if (!isDesktop || isMobileBreakpoint) {
        return () => {};
    }

    const magneticElements = Array.from(document.querySelectorAll('.is-magnetic'));
    const listeners = [];

    magneticElements.forEach((element) => {
        const handleMouseMove = (event) => {
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;

            gsap.to(element, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.8,
                ease: 'power4.out',
            });
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 1.2,
                ease: 'elastic.out(1, 0.6)',
            });
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
        listeners.push(() => element.removeEventListener('mousemove', handleMouseMove));
        listeners.push(() => element.removeEventListener('mouseleave', handleMouseLeave));
    });

    return () => listeners.splice(0).forEach((cleanup) => cleanup());
}

function initScrollRevealText() {
    const cleanupRegistry = createCleanupRegistry();
    const contentText = document.querySelector('.content_text');
    const revealWrap = document.querySelector('.reveal_wrap');

    if (contentText && revealWrap) {
        const splitContentText = createSplitText(contentText, { type: 'words' });

        if (splitContentText?.words?.length) {
            gsap.from(splitContentText.words, {
                opacity: 0.2,
                stagger: 0.05,
                scrollTrigger: {
                    trigger: revealWrap,
                    start: 'top 90%',
                    end: 'bottom center',
                    scrub: true,
                },
            });

            cleanupRegistry.add(() => splitContentText.revert());
        }
    }

    const headerReveal = document.querySelector('#header-reveal');
    const bodyReveal = document.querySelector('#body-reveal');

    if (!headerReveal || !bodyReveal) {
        return () => cleanupRegistry.run();
    }

    const headerText = createSplitText(headerReveal, {
        type: 'words, lines',
        linesClass: 'header-line-wrapper',
    });
    const bodyText = createSplitText(bodyReveal, {
        type: 'words',
        wordsClass: 'word-container',
    });

    if (bodyText?.words?.length) {
        wrapWords(bodyText.words);
        gsap.set(bodyText.words, { autoAlpha: 0, y: 100 });
    }

    if (headerText?.words?.length || bodyText?.words?.length) {
        const revealTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '#header-reveal',
                // past hero; scrub text must not appear in initial 100vh
                start: 'top 40%',
            },
        });

        revealTimeline.set(['#header-reveal', '#body-reveal'], { autoAlpha: 1 });

        revealTimeline.from(headerText?.words ?? [], {
                yPercent: 105,
                opacity: 0,
                stagger: 0.05,
                duration: 1.5,
                ease: 'power4.inOut',
            });

        const blockerWrap = document.querySelector('.blocker_wrap');

        if (blockerWrap) {
            revealTimeline.from(
                blockerWrap,
                {
                    opacity: 0,
                    duration: 1.5,
                    ease: 'power4.inOut',
                },
                '<'
            );
        }

        revealTimeline.to(
            bodyText?.words ?? [],
            {
                autoAlpha: 1,
                y: 0,
                duration: 1.5,
                stagger: { amount: 0.5 },
                ease: 'power4.inOut',
            },
            '<'
        );
    }

    cleanupRegistry.add(() => headerText?.revert());
    cleanupRegistry.add(() => bodyText?.revert());

    return () => cleanupRegistry.run();
}

function initNavigationTimelines() {
    const nav = document.querySelector('#nav');
    const heroContain = document.querySelector('.hero_contain');
    const navItems = document.querySelectorAll('.nav-item');

    if (!nav || !heroContain) {
        return () => {};
    }

    const showNavTimeline = gsap.timeline({ paused: true });
    showNavTimeline.to('#nav', { yPercent: 0, duration: 0.5, ease: 'power2.out' });

    if (navItems.length > 0) {
        showNavTimeline.fromTo(
            navItems,
            {
                opacity: 0,
                y: 20,
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.1,
                ease: 'power2.out',
            },
            '-=0.3'
        );
    }

    const hideNavTimeline = gsap.timeline({ paused: true });
    if (navItems.length > 0) {
        hideNavTimeline.to(navItems, {
            opacity: 0,
            y: 20,
            duration: 0.3,
            stagger: {
                each: 0.05,
                from: 'end',
            },
            ease: 'power2.in',
        });
    }

    hideNavTimeline.to('#nav', { yPercent: -100, duration: 0.4, ease: 'power2.in' }, '-=0.2');

    const heroTrigger = ScrollTrigger.create({
        trigger: heroContain,
        start: 'bottom top',
        onEnter: () => showNavTimeline.restart(),
        onLeaveBack: () => hideNavTimeline.restart(),
    });

    const footer = document.querySelector('footer');
    let footerTrigger = null;

    if (footer) {
        const footerWordmarkPaths = document.querySelectorAll('.footer-path');

        if (footerWordmarkPaths.length > 0) {
            gsap.set(footerWordmarkPaths, {
                yPercent: 100,
                opacity: 0,
            });
        }

        footerTrigger = ScrollTrigger.create({
            trigger: footer,
            start: 'top 80%',
            end: 'top 50%',
            id: 'footer-animations',
            onEnter: () => {
                hideNavTimeline.restart();

                if (footerWordmarkPaths.length > 0) {
                    gsap.to(footerWordmarkPaths, {
                        yPercent: 0,
                        opacity: 1,
                        duration: 1.2,
                        ease: 'power3.out',
                        stagger: { amount: 0.3 },
                    });
                }
            },
            onLeaveBack: () => {
                showNavTimeline.restart();

                if (footerWordmarkPaths.length > 0) {
                    gsap.to(footerWordmarkPaths, {
                        yPercent: 100,
                        opacity: 0,
                        duration: 0.6,
                        ease: 'power2.in',
                        stagger: { amount: 0.2 },
                    });
                }
            },
        });
    }

    return () => {
        heroTrigger.kill();
        footerTrigger?.kill();
    };
}

function initHamburgerMenus() {
    const cleanupRegistry = createCleanupRegistry();

    document.querySelectorAll('.nav_wrap').forEach((navWrap) => {
        const hamburgerEl = navWrap.querySelector('.nav_hamburger_wrap');
        const navLineEls = navWrap.querySelectorAll('.nav_hamburger_line');
        const menuContainEl = navWrap.querySelector('.menu_contain');
        const flipItemEl = navWrap.querySelector('.nav_hamburger_base');
        const menuWrapEl = navWrap.querySelector('.menu_wrap');
        const menuBaseEl = navWrap.querySelector('.menu_base');
        const menuLinkEls = navWrap.querySelectorAll('.menu_link');
        const flipDuration = 0.75;

        if (!hamburgerEl || !menuContainEl || !flipItemEl || !menuWrapEl || !menuBaseEl) {
            return;
        }

        const flip = (forwards) => {
            const state = Flip.getState(flipItemEl);

            if (forwards) {
                menuContainEl.appendChild(flipItemEl);
            } else {
                hamburgerEl.appendChild(flipItemEl);
            }

            Flip.from(state, { duration: flipDuration, ease: 'power3.inOut' });
        };

        const timeline = gsap.timeline({ paused: true });
        timeline.set(menuWrapEl, { display: 'flex' });
        timeline.from(menuBaseEl, {
            opacity: 0,
            duration: flipDuration,
            ease: 'none',
            onStart: () => flip(true),
        });
        timeline.to(navLineEls[0], { y: 4, rotate: 45, duration: flipDuration }, '<');
        timeline.to(navLineEls[1], { y: -4, rotate: -45, duration: flipDuration }, '<');
        timeline.from(
            menuLinkEls,
            {
                delay: -0.4,
                ease: 'power3.inOut',
                y: '-100',
                duration: 2,
                stagger: 0.05,
                onReverseComplete: () => flip(false),
            },
            '<'
        );

        const openMenu = (open) => {
            if (timeline.isActive()) {
                return;
            }

            if (open) {
                timeline.play();
                hamburgerEl.classList.add('nav-open');
                return;
            }

            timeline.reverse();
            hamburgerEl.classList.remove('nav-open');
        };

        const handleHamburgerClick = () =>
            openMenu(!hamburgerEl.classList.contains('nav-open'));
        const handleMenuBaseClick = () => openMenu(false);
        const handleKeydown = (event) => {
            if (event.key === 'Escape' && hamburgerEl.classList.contains('nav-open')) {
                openMenu(false);
            }
        };

        hamburgerEl.addEventListener('click', handleHamburgerClick);
        menuBaseEl.addEventListener('click', handleMenuBaseClick);
        document.addEventListener('keydown', handleKeydown);

        cleanupRegistry.add(() => hamburgerEl.removeEventListener('click', handleHamburgerClick));
        cleanupRegistry.add(() => menuBaseEl.removeEventListener('click', handleMenuBaseClick));
        cleanupRegistry.add(() => document.removeEventListener('keydown', handleKeydown));
    });

    return () => cleanupRegistry.run();
}

function misc() {
    const cleanupRegistry = createCleanupRegistry();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileBreakpoint = window.innerWidth < 1024;
    const isDesktop = !isTouchDevice;
    const shouldUseTouchBehavior = isTouchDevice || isMobileBreakpoint;

    cleanupRegistry.add(initTooltipSystem());

    gsap.set('#nav', { yPercent: -100 });
    gsap.set('.hero-wordmark .hero-path', { yPercent: 100, opacity: 0 });
    gsap.set('.hero-nav-item', { y: -100, opacity: 0 });
    gsap.set('.tooltip_wrap', { autoAlpha: 0 });

    const headerSplit = document.querySelector('#header-split');

    if (headerSplit) {
        headerSplitText = createSplitText(headerSplit, {
            type: 'lines, words',
            linesClass: 'split-line',
        });

        if (headerSplitText?.words?.length) {
            gsap.set(headerSplitText.words, { y: '108%' });
        }
    }

    cleanupRegistry.add(initMagneticElements(isDesktop, isMobileBreakpoint));

    if (document.querySelector('.hero_main_wrap')) {
        gsap.to('.hero_main_wrap', {
            scrollTrigger: {
                trigger: '.hero_main_wrap',
                start: 'top top',
                end: '130vh top',
                scrub: true,
            },
            autoAlpha: 0,
            ease: 'none',
        });
    }

    cleanupRegistry.add(initScrollRevealText());
    cleanupRegistry.add(initClocks());
    cleanupRegistry.add(initCardRecoveryHandlers());
    cleanupRegistry.add(
        initCardInteractions({
            isDesktop,
            isMobileBreakpoint,
            shouldUseTouchBehavior,
        })
    );
    cleanupRegistry.add(initNavigationTimelines());
    cleanupRegistry.add(initHamburgerMenus());
    cleanupRegistry.add(initFaqAccordions());
    cleanupRegistry.add(initSmoothScrollLinks());

    return () => cleanupRegistry.run();
}

function scrub() {
    return initScrubSequence({ onPreloaderComplete: playHeroReveal });
}

function init() {
    const cleanupRegistry = createCleanupRegistry();

    cleanupRegistry.add(misc());
    cleanupRegistry.add(scrub());

    if (!document.querySelector('.scrub_contain')) {
        playHeroReveal();
    }

    return () => cleanupRegistry.run();
}

export { init as default, playHeroReveal, scrub, misc };