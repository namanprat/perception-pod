import { gsap } from '../runtime/gsapRuntime';

function resolveTargetSelector(link) {
    if (link.hasAttribute('data-scroll-to')) {
        return link.getAttribute('data-scroll-to');
    }

    if (link.id === 'service-link') {
        return '#services';
    }

    if (link.id === 'about-link') {
        return '#about';
    }

    if (link.href?.includes('#')) {
        const hash = link.href.split('#')[1];
        return hash ? `#${hash}` : null;
    }

    return null;
}

export function initSmoothScrollLinks() {
    const scrollLinks = Array.from(
        document.querySelectorAll('.scroll-link, #service-link, #about-link')
    );
    const footerWordmark = document.querySelector('.footer_wordmark');
    const listeners = [];

    const addListener = (element, eventName, handler) => {
        element.addEventListener(eventName, handler);
        listeners.push(() => element.removeEventListener(eventName, handler));
    };

    scrollLinks.forEach((link) => {
        addListener(link, 'click', (event) => {
            event.preventDefault();

            const targetSelector = resolveTargetSelector(link);

            if (!targetSelector || !document.querySelector(targetSelector)) {
                console.warn(`Scroll-to target "${targetSelector}" not found.`);
                return;
            }

            gsap.to(window, {
                duration: 1.5,
                ease: 'power2.inOut',
                scrollTo: {
                    y: targetSelector,
                    offsetY: 0,
                },
            });
        });
    });

    if (footerWordmark) {
        addListener(footerWordmark, 'click', (event) => {
            event.preventDefault();

            gsap.to(window, {
                duration: 1.5,
                ease: 'power2.inOut',
                scrollTo: {
                    y: 0,
                    offsetY: 0,
                },
            });
        });
    }

    return () => {
        listeners.splice(0).forEach((cleanup) => cleanup());
    };
}
