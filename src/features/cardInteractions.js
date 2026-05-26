import { gsap } from '../runtime/gsapRuntime';
import { rafThrottle } from '../utils/dom';

function resetCardTransformStyles(card) {
    card.style.transform = 'scale(1)';
    card.style.webkitTransform = 'scale(1)';
    card.style.MozTransform = 'scale(1)';
    card.style.msTransform = 'scale(1)';
    card.style.OTransform = 'scale(1)';

    const cardInner = card.querySelector('.card_inner');

    if (cardInner) {
        cardInner.style.transform = 'scale(1)';
        cardInner.style.webkitTransform = 'scale(1)';
    }
}

export function resetAllCards() {
    document.querySelectorAll('.card_wrap').forEach((card) => {
        gsap.set(card, {
            rotationX: 0,
            rotationY: 0,
            scale: 1,
        });

        resetCardTransformStyles(card);
    });
}

export function initCardRecoveryHandlers() {
    const handleFocus = () => resetAllCards();
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            resetAllCards();
        }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
}

export function initCardInteractions({
    isDesktop,
    isMobileBreakpoint,
    shouldUseTouchBehavior,
}) {
    const cards = Array.from(document.querySelectorAll('.card_wrap'));

    if (cards.length === 0) {
        return () => {};
    }

    const listeners = [];
    let currentlyFlippedCard = null;

    const addListener = (element, eventName, handler) => {
        element.addEventListener(eventName, handler);
        listeners.push(() => element.removeEventListener(eventName, handler));
    };

    const flipBackCurrentCard = () => {
        if (!currentlyFlippedCard) {
            return;
        }

        const cardInner = currentlyFlippedCard.querySelector('.card_inner');

        if (cardInner) {
            gsap.to(cardInner, {
                rotationY: 0,
                duration: 0.7,
                ease: 'power3.inOut',
            });
        }

        currentlyFlippedCard.isFlipped = false;
        currentlyFlippedCard = null;
    };

    addListener(document, 'click', (event) => {
        const clickedCard = event.target.closest('.card_wrap');

        if (!clickedCard && currentlyFlippedCard) {
            flipBackCurrentCard();
        }
    });

    addListener(document, 'keydown', (event) => {
        if (event.key === 'Escape' && currentlyFlippedCard) {
            flipBackCurrentCard();
        }
    });

    cards.forEach((card) => {
        const cardInner = card.querySelector('.card_inner');
        const highlight = card.querySelector('.card-highlight');
        const rotateXTo = gsap.quickTo(card, 'rotationX', {
            duration: 0.35,
            ease: 'power2.out',
        });
        const rotateYTo = gsap.quickTo(card, 'rotationY', {
            duration: 0.35,
            ease: 'power2.out',
        });
        const scaleTo = gsap.quickTo(card, 'scale', {
            duration: 0.4,
            ease: 'power2.out',
        });
        let isFlipped = false;
        let isHovered = false;
        let isAnimating = false;
        let mouseRect = null;

        gsap.set(card, {
            transformPerspective: 1000,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            force3D: true,
        });
        resetCardTransformStyles(card);

        const resetHoverState = () => {
            rotateXTo(0);
            rotateYTo(0);
            scaleTo(1);

            if (highlight) {
                gsap.to(highlight, {
                    opacity: 0,
                    duration: 0.25,
                    ease: 'power2.out',
                });
            }
        };

        const updateHighlight = (mouseX, mouseY, rect) => {
            if (!highlight || !isHovered) {
                return;
            }

            highlight.style.setProperty('--mx', `${mouseX}px`);
            highlight.style.setProperty('--my', `${mouseY}px`);
            highlight.style.setProperty('--gx', `${(mouseX / rect.width) * 100}%`);
            highlight.style.setProperty('--gy', `${(mouseY / rect.height) * 100}%`);
        };

        const updateTilt = rafThrottle((event) => {
            if (!mouseRect) {
                mouseRect = card.getBoundingClientRect();
            }

            const mouseX = event.clientX - mouseRect.left;
            const mouseY = event.clientY - mouseRect.top;

            if (
                mouseX < 0 ||
                mouseX > mouseRect.width ||
                mouseY < 0 ||
                mouseY > mouseRect.height
            ) {
                return;
            }

            const targetRotateX =
                -((mouseY - mouseRect.height / 2) / (mouseRect.height / 2)) * 12;
            const targetRotateY =
                ((mouseX - mouseRect.width / 2) / (mouseRect.width / 2)) * 12;

            rotateXTo(targetRotateX);
            rotateYTo(targetRotateY);
            scaleTo(1.05);
            updateHighlight(mouseX, mouseY, mouseRect);
        });

        addListener(card, 'click', (event) => {
            event.stopPropagation();

            if (!cardInner || isAnimating) {
                return;
            }

            isAnimating = true;

            if (currentlyFlippedCard && currentlyFlippedCard !== card) {
                const otherCardInner = currentlyFlippedCard.querySelector('.card_inner');

                if (otherCardInner) {
                    gsap.to(otherCardInner, {
                        rotationY: 0,
                        duration: 0.7,
                        ease: 'power3.inOut',
                    });
                }

                currentlyFlippedCard.isFlipped = false;
            }

            isFlipped = !isFlipped;
            currentlyFlippedCard = isFlipped ? card : null;
            card.isFlipped = isFlipped;

            gsap.to(cardInner, {
                rotationY: isFlipped ? 180 : 0,
                duration: 0.7,
                ease: 'power3.inOut',
                onStart: () => {
                    if (highlight) {
                        gsap.to(highlight, { opacity: 0, duration: 0.1 });
                        highlight.style.setProperty('--mx', '50%');
                        highlight.style.setProperty('--my', '50%');
                        highlight.style.setProperty('--gx', '50%');
                        highlight.style.setProperty('--gy', '50%');
                    }

                    if (!shouldUseTouchBehavior) {
                        rotateXTo(0);
                        rotateYTo(0);
                        scaleTo(isHovered && !isFlipped ? 1.05 : 1);
                    }
                },
                onComplete: () => {
                    isAnimating = false;

                    if (isDesktop && !isFlipped && highlight && !isMobileBreakpoint && isHovered) {
                        gsap.to(highlight, { opacity: 1, duration: 0.2 });
                    }
                },
            });
        });

        if (!isDesktop || isMobileBreakpoint) {
            return;
        }

        addListener(card, 'mouseenter', (event) => {
            if (card.contains(event.relatedTarget)) {
                return;
            }

            isHovered = true;
            mouseRect = card.getBoundingClientRect();

            if (!isFlipped) {
                scaleTo(1.05);
            }

            if (highlight && !isFlipped) {
                gsap.to(highlight, { opacity: 1, duration: 0.2 });
            }
        });

        addListener(card, 'mouseleave', (event) => {
            if (card.contains(event.relatedTarget)) {
                return;
            }

            isHovered = false;
            mouseRect = null;
            resetHoverState();
        });

        addListener(card, 'mousemove', (event) => {
            if (shouldUseTouchBehavior || isAnimating || isFlipped || !cardInner) {
                return;
            }

            updateTilt(event);
        });
    });

    return () => {
        listeners.splice(0).forEach((cleanup) => cleanup());
    };
}
