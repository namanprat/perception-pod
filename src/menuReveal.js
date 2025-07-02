import { gsap } from 'gsap';

function menu() {
    gsap.set(".contact_wrap", { autoAlpha: 0 });
    gsap.set(".contact-contain", { opacity: 0, width: 0 });

      const openTl = gsap.timeline({ paused: true });

        openTl
            .to('.contact_wrap', { 
                autoAlpha: 1, 
                duration: 0.4, 
                ease: 'power2.inOut' 
            })
            .to('.contact-contain', { 
                opacity: 1,
                width: 'auto', 
                duration: 1.5, 
                ease: 'power4.inOut' 
            }, '<')
            .from('.contact-contain *', { 
                opacity: 0,
                duration: 2, 
                ease: 'power3.inOut' 
            }, '<')
            .from('form h3', { 
                delay: 0.1,
                y: -100,
                stagger: {
                    amount: 0.8,
                },
                duration: 2, 
                ease: 'power3.out' 
            }, '<');

        document.querySelector('.contact-flip').addEventListener('click', () => {
            openTl.play();
        });

        // document.querySelector('.contact-close').addEventListener('click', () => {
        //     openTl.reverse();
        // });
        //  document.querySelector('.contact-close-2').addEventListener('click', () => {
        //     openTl.reverse();
        // });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && openTl.progress() > 0 && !openTl.reversed()) {
                openTl.reverse();
            }
        });

}
export default menu;