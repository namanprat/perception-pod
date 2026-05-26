import { gsap } from './runtime/gsapRuntime';

function menu() {
    const contactWrap = document.querySelector('.contact_wrap');
    const contactContain = document.querySelector('.contact-contain');
    const contactClose = document.querySelector('.contact-close');
    const contactArrow = document.querySelector('.contact-arrow');
    const openTriggers = Array.from(
        document.querySelectorAll('.contact-flip, .contact-flip-2, .contact-flip-3')
    );

    if (!contactWrap || !contactContain || openTriggers.length === 0 || !contactClose) {
        return () => {};
    }

    gsap.set('.contact_wrap', { autoAlpha: 0 });
    gsap.set('.contact-contain', { opacity: 0 });

    const animatedChildren = Array.from(contactContain.children);
    const listeners = [];

    const openTl = gsap.timeline({ paused: true });

    openTl
        .to('.contact_wrap', {
            autoAlpha: 1,
            duration: 0.4,
            ease: 'power2.inOut',
        })
        .to(
            '.contact-contain',
            {
                opacity: 1,
                duration: 1.5,
                ease: 'power4.inOut',
            },
            '<'
        )
        .from(
            '.contact-close',
            {
                opacity: 0,
                duration: 0.6,
                ease: 'power3.inOut',
            },
            '<'
        )
        .from(
            animatedChildren,
            {
                opacity: 0,
                duration: 0.9,
                stagger: 0.08,
                ease: 'power3.inOut',
            },
            '<'
        )
        .from(
            'form h3',
            {
                delay: -0.1,
                y: -100,
                stagger: { amount: 0.2 },
                duration: 1.1,
                ease: 'power4.inOut',
            },
            '<'
        );

    const addListener = (element, eventName, handler) => {
        element.addEventListener(eventName, handler);
        listeners.push(() => element.removeEventListener(eventName, handler));
    };

    openTriggers.forEach((trigger) => {
        addListener(trigger, 'click', () => {
            openTl.play();
        });
    });

    addListener(contactClose, 'click', () => {
        openTl.reverse();
    });

    if (contactArrow) {
        addListener(contactArrow, 'click', () => {
            openTl.reverse();
        });
    }

    const handleKeydown = (event) => {
        if (event.key === 'Escape' && openTl.progress() > 0 && !openTl.reversed()) {
            openTl.reverse();
        }
    };

    addListener(document, 'keydown', handleKeydown);

    return () => {
        listeners.splice(0).forEach((cleanup) => cleanup());
    };
}
export default menu;