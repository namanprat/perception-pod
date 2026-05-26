import { gsap } from '../runtime/gsapRuntime';

export function initFaqAccordions() {
    const faqWrappers = Array.from(document.querySelectorAll('.faq-wrapper'));

    if (faqWrappers.length === 0) {
        return () => {};
    }

    const listeners = [];
    let activeFAQ = null;

    const addListener = (element, eventName, handler) => {
        element.addEventListener(eventName, handler);
        listeners.push(() => element.removeEventListener(eventName, handler));
    };

    const closeFAQ = (wrapper) => {
        const arrow = wrapper.querySelector('.faq-arrow');
        const answerWrapper = wrapper.querySelector('.faq-answer-wrapper');

        if (!answerWrapper) {
            return;
        }

        const closeTimeline = gsap.timeline();
        const currentHeight = answerWrapper.offsetHeight;

        gsap.set(answerWrapper, { height: currentHeight });

        closeTimeline.to(answerWrapper, {
            height: 0,
            duration: 0.5,
            ease: 'power3.in',
        });

        if (arrow) {
            closeTimeline.to(
                arrow,
                {
                    rotation: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                },
                '-=0.4'
            );
        }

        wrapper.classList.remove('faq-active');
    };

    const openFAQ = (wrapper) => {
        const arrow = wrapper.querySelector('.faq-arrow');
        const answerWrapper = wrapper.querySelector('.faq-answer-wrapper');

        if (!answerWrapper) {
            return;
        }

        const openTimeline = gsap.timeline();

        if (arrow) {
            openTimeline.to(arrow, {
                rotation: 45,
                duration: 0.4,
                ease: 'power2.inOut',
            });
        }

        gsap.set(answerWrapper, { height: 'auto' });
        const naturalHeight = answerWrapper.offsetHeight;
        gsap.set(answerWrapper, { height: 0 });

        openTimeline.to(
            answerWrapper,
            {
                height: naturalHeight,
                duration: 0.6,
                ease: 'power3.inOut',
            },
            arrow ? '-=0.2' : 0
        );

        openTimeline.set(answerWrapper, { height: 'auto' });
        wrapper.classList.add('faq-active');
    };

    faqWrappers.forEach((wrapper) => {
        const answerWrapper = wrapper.querySelector('.faq-answer-wrapper');
        const arrow = wrapper.querySelector('.faq-arrow');
        const faqHeader = wrapper.querySelector('.faq-header');

        if (!answerWrapper) {
            return;
        }

        gsap.set(answerWrapper, {
            height: 0,
            overflow: 'hidden',
            autoAlpha: 1,
        });

        const toggleFAQ = (event) => {
            event.preventDefault();
            event.stopPropagation();

            const isCurrentlyActive = activeFAQ === wrapper;

            if (activeFAQ && activeFAQ !== wrapper) {
                closeFAQ(activeFAQ);
            }

            if (isCurrentlyActive) {
                closeFAQ(wrapper);
                activeFAQ = null;
                return;
            }

            openFAQ(wrapper);
            activeFAQ = wrapper;
        };

        if (arrow) {
            addListener(arrow, 'click', toggleFAQ);
        }

        if (faqHeader) {
            faqHeader.style.cursor = 'pointer';
            addListener(faqHeader, 'click', toggleFAQ);
        }
    });

    const handleDocumentClick = (event) => {
        const clickedFAQ = event.target.closest('.faq-wrapper');
        const clickedCard = event.target.closest('.card_wrap');

        if (!clickedFAQ && !clickedCard && activeFAQ) {
            closeFAQ(activeFAQ);
            activeFAQ = null;
        }
    };

    const handleKeydown = (event) => {
        if (event.key === 'Escape' && activeFAQ) {
            closeFAQ(activeFAQ);
            activeFAQ = null;
        }
    };

    addListener(document, 'click', handleDocumentClick);
    addListener(document, 'keydown', handleKeydown);

    return () => {
        listeners.splice(0).forEach((cleanup) => cleanup());
    };
}
