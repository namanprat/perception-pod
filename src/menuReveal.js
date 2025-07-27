import { gsap } from 'gsap';

function menu() {

    gsap.set(".contact_wrap", { autoAlpha: 0 });
    gsap.set(".contact-contain", { opacity: 0 });
    // gsap.set (".contact-contain .u-hflex-between-center", { y:0 });

      const openTl = gsap.timeline({ paused: true });

        openTl
            .to('.contact_wrap', { 
                autoAlpha: 1, 
                duration: 0.4, 
                ease: 'power2.inOut' 
            })
            .to('.contact-contain', { 
                opacity: 1,
                duration: 1.5, 
                ease: 'power4.inOut' 
            }, '<')
            .from('.contact-close', { 
                opacity: 0,
                duration: 2, 
                ease: 'power3.inOut' 
            }, '<')
            .from('.contact-contain *', { 
                opacity: 0,
                duration: 2, 
                ease: 'power3.inOut' 
            }, '<')
            //  .to(".contact-contain .u-text-style-h2", { 
            //     y: 0,
            //     duration: 1.5, 
            //     ease: 'power4.inOut' 
            // }, '<')
            .from('form h3', { 
                delay: -0.1,
                y: -100,
                stagger: {amount: 0.2},
                duration: 2.25, 
                ease: 'power4.inOut' 
            }, '<');

        document.querySelector('.contact-flip').addEventListener('click', () => {
            openTl.play();
        });
        document.querySelector('.contact-flip-2').addEventListener('click', () => {
            openTl.play();
        });
        document.querySelector('.contact-flip-3').addEventListener('click', () => {
            openTl.play();
        });

         document.querySelector('.contact-close').addEventListener('click', () => {
             openTl.reverse();
         });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && openTl.progress() > 0 && !openTl.reversed()) {
                openTl.reverse();
            }
        });

}
export default menu;