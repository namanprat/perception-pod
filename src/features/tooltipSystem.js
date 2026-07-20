import { getSplitText, gsap, ScrollTrigger } from '../runtime/gsapRuntime';

function wrapWords(words) {
    words.forEach((word) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'u-overflow-hidden';
        wrapper.style.display = 'inline-block';
        word.parentNode.insertBefore(wrapper, word);
        wrapper.appendChild(word);
    });
}

function clearTooltipState(state) {
    if (state.currentHeaderSplit) {
        state.currentHeaderSplit.revert();
        state.currentHeaderSplit = null;
    }

    if (state.currentBodySplit) {
        state.currentBodySplit.revert();
        state.currentBodySplit = null;
    }
}

function createTooltipSplit(element, type, wordsClass) {
    const SplitText = getSplitText();

    if (!SplitText || !element || !element.textContent?.trim()) {
        return null;
    }

    return new SplitText(element, { type, wordsClass });
}

function applyTooltipContent(state, headerText, bodyText, animate = true) {
    const { tooltipHeader, tooltipBody } = state;

    clearTooltipState(state);

    if (tooltipHeader && headerText !== null && headerText !== undefined) {
        gsap.set(tooltipHeader, { autoAlpha: 1, display: 'block' });
        tooltipHeader.textContent = headerText;
        state.currentHeaderSplit = createTooltipSplit(tooltipHeader, 'words', 'tooltip-word');

        if (state.currentHeaderSplit?.words?.length) {
            gsap.set(state.currentHeaderSplit.words, {
                y: animate ? 15 : 0,
                opacity: animate ? 0 : 1,
            });
        }
    }

    if (tooltipBody && bodyText !== null && bodyText !== undefined) {
        gsap.set(tooltipBody, { autoAlpha: 1, display: 'block' });
        tooltipBody.textContent = bodyText;
        state.currentBodySplit = createTooltipSplit(tooltipBody, 'words', 'tooltip-body-word');

        if (state.currentBodySplit?.words?.length) {
            wrapWords(state.currentBodySplit.words);
            gsap.set(state.currentBodySplit.words, {
                autoAlpha: animate ? 0 : 1,
                y: animate ? 100 : 0,
            });
        }
    }

    if (!animate) {
        return;
    }

    if (state.currentHeaderSplit?.words?.length) {
        gsap.to(state.currentHeaderSplit.words, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: { amount: 0.4 },
            ease: 'power3.out',
        });
    }

    if (state.currentBodySplit?.words?.length) {
        gsap.to(state.currentBodySplit.words, {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            stagger: { amount: 0.4 },
            ease: 'power4.inOut',
        });
    }
}

function animateTooltipSwap(state, headerText, bodyText) {
    const timeline = gsap.timeline();
    const previousHeaderSplit = state.currentHeaderSplit;
    const previousBodySplit = state.currentBodySplit;

    if (previousHeaderSplit?.words?.length) {
        timeline.to(previousHeaderSplit.words, {
            autoAlpha: 0,
            y: -50,
            duration: 0.4,
            stagger: { amount: 0.1, from: 'end' },
            ease: 'power2.in',
        });
    }

    if (previousBodySplit?.words?.length) {
        timeline.to(
            previousBodySplit.words,
            {
                autoAlpha: 0,
                y: -50,
                duration: 0.4,
                stagger: { amount: 0.1, from: 'end' },
                ease: 'power2.in',
            },
            '-=0.15'
        );
    }

    timeline.add(() => applyTooltipContent(state, headerText, bodyText, true));
    return timeline;
}

function removePulseElements(circle) {
    circle.querySelectorAll('.tooltip-circle-pulse').forEach((pulse) => pulse.remove());
}

export function initTooltipSystem() {
    const tooltipCircles = gsap.utils.toArray('.tooltip-circle');
    const tooltipWrap = document.querySelector('.tooltip_wrap');
    const tooltipInfos = gsap.utils.toArray('.tooltip-info');
    const tooltipHeader = document.querySelector('#tooltip-header');
    const tooltipBody = document.querySelector('#tooltip-body');
    const scrubWrap = document.querySelector('.scrub_wrap');

    if (!scrubWrap || tooltipCircles.length === 0) {
        return () => {};
    }

    const state = {
        activeCircle: null,
        currentBodySplit: null,
        currentHeaderSplit: null,
        originalBodyText: tooltipBody?.textContent || '',
        originalHeaderText: tooltipHeader?.textContent || '',
        tooltipBody,
        tooltipHeader,
    };
    const listeners = [];
    const revealedCircles = new Set();
    let pulseAnimationAdded = false;
    let lastRevealedIndex = -1;

    const addListener = (element, eventName, handler) => {
        element.addEventListener(eventName, handler);
        listeners.push(() => element.removeEventListener(eventName, handler));
    };

    const setTooltipShellVisibility = (visible, duration = 0) => {
        const targets = [tooltipWrap, ...tooltipInfos].filter(Boolean);

        if (targets.length === 0) {
            return;
        }

        if (duration > 0) {
            gsap.to(targets, {
                autoAlpha: visible ? 1 : 0,
                duration,
                ease: visible ? 'power2.out' : 'power3.out',
            });
            return;
        }

        gsap.set(targets, { autoAlpha: visible ? 1 : 0 });
    };

    const resetTooltipInfo = () => {
        clearTooltipState(state);

        if (tooltipHeader) {
            tooltipHeader.textContent = state.originalHeaderText;
            gsap.set(tooltipHeader, { autoAlpha: 0, display: 'block' });
        }

        if (tooltipBody) {
            tooltipBody.textContent = state.originalBodyText;
            gsap.set(tooltipBody, { autoAlpha: 0, display: 'block' });
        }

        state.activeCircle = null;
    };

    const restoreOriginalTooltip = () => {
        if (state.activeCircle) {
            return;
        }

        applyTooltipContent(state, state.originalHeaderText, state.originalBodyText, true);
    };

    const addRadialPulseToCircles = () => {
        if (pulseAnimationAdded) {
            return;
        }

        pulseAnimationAdded = true;

        tooltipCircles.forEach((circle) => {
            const createPulse = (scale, opacity, delay = 0) => {
                const pulseElement = document.createElement('div');
                pulseElement.className = 'tooltip-circle-pulse';

                Object.assign(pulseElement.style, {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '120%',
                    height: '120%',
                    borderRadius: '50%',
                    background:
                        'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.1) 70%, transparent 100%)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transform: 'translate(-50%, -50%) scale(0.8)',
                    pointerEvents: 'none',
                    zIndex: '10',
                    opacity: `${opacity}`,
                });

                circle.style.position = 'relative';
                circle.style.overflow = 'visible';
                circle.appendChild(pulseElement);

                gsap.set(pulseElement, { scale: 0.8, opacity });
                gsap.to(pulseElement, {
                    scale,
                    opacity: 0,
                    duration: 2,
                    ease: 'power2.out',
                    repeat: -1,
                    repeatDelay: 1,
                    delay,
                });
            };

            createPulse(2.5, 0.8, 0);
            createPulse(2.2, 0.6, 1);
        });
    };

    const revealCircle = (circle) => {
        if (revealedCircles.has(circle)) {
            return;
        }

        revealedCircles.add(circle);

        gsap.to(circle, {
            autoAlpha: 1,
            duration: 0.6,
            ease: 'back.out(1.7)',
        });
    };

    gsap.set('.tooltip-circle', { autoAlpha: 0 });
    setTooltipShellVisibility(false);
    resetTooltipInfo();

    const tooltipTrigger = ScrollTrigger.create({
        trigger: scrubWrap,
        // past hero overlap (-100vh canvas bleed); keep UI out of initial 100vh
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
            setTooltipShellVisibility(true, 0.2);
            restoreOriginalTooltip();
        },
        onEnterBack: () => {
            setTooltipShellVisibility(true, 0.2);
            restoreOriginalTooltip();
        },
        onUpdate: (self) => {
            const currentTooltipIndex = Math.floor(self.progress * tooltipCircles.length);

            if (currentTooltipIndex > lastRevealedIndex) {
                for (let index = lastRevealedIndex + 1; index <= currentTooltipIndex; index += 1) {
                    const circle = tooltipCircles[index];

                    if (circle) {
                        revealCircle(circle);
                    }
                }

                lastRevealedIndex = currentTooltipIndex;
            }

            if (self.progress > 0.1) {
                addRadialPulseToCircles();
            }
        },
        onLeaveBack: () => {
            setTooltipShellVisibility(false, 0.8);
            tooltipCircles.forEach((circle) => {
                circle.classList.remove('tooltip-active');
                removePulseElements(circle);
            });

            revealedCircles.clear();
            lastRevealedIndex = -1;
            pulseAnimationAdded = false;
            gsap.set('.tooltip-circle', { autoAlpha: 0, opacity: 1, scale: 1 });
            resetTooltipInfo();
        },
    });

    tooltipCircles.forEach((circle, index) => {
        addListener(circle, 'mouseenter', function handleMouseEnter() {
            gsap.to(this, {
                scale: 1.3,
                duration: 0.3,
                ease: 'back.out(1.7)',
            });

            tooltipCircles.forEach((otherCircle) => {
                if (otherCircle !== this) {
                    gsap.to(otherCircle, {
                        opacity: 0.5,
                        duration: 0.3,
                        ease: 'power2.out',
                    });
                }
            });
        });

        addListener(circle, 'mouseleave', function handleMouseLeave() {
            gsap.to(this, {
                scale: 1,
                duration: 0.4,
                ease: 'elastic.out(1, 0.6)',
            });

            gsap.to(tooltipCircles, {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out',
            });
        });

        addListener(circle, 'click', function handleClick() {
            state.activeCircle = this;
            tooltipCircles.forEach((currentCircle) =>
                currentCircle.classList.remove('tooltip-active')
            );
            this.classList.add('tooltip-active');

            gsap.to(tooltipCircles, {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out',
            });

            animateTooltipSwap(
                state,
                this.getAttribute('data-header') || `Content ${index + 1}`,
                this.getAttribute('data-body') ||
                    `This is the main content for circle ${index + 1}. You clicked to activate this.`
            );

            gsap.to(this, {
                scale: 1.5,
                duration: 0.1,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1,
            });
        });
    });

    return () => {
        tooltipTrigger.kill();
        listeners.splice(0).forEach((cleanup) => cleanup());
        tooltipCircles.forEach((circle) => removePulseElements(circle));
        clearTooltipState(state);
    };
}
