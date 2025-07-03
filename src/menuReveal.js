import { gsap } from 'gsap';

function menu() {
//     const targets = document.querySelectorAll('.contact-h3');

// // Loop through each found element
// targets.forEach(target => {
//   // 1. Create a new <div> element to act as the wrapper
//   const wrapper = document.createElement('div');
  
//   // 2. Add the desired class to the new wrapper
//   wrapper.classList.add('h3_wrap');

//   // 3. Insert the wrapper into the DOM right before the target element
//   //    (target.parentNode is the element that contains the h3)
//   target.parentNode.insertBefore(wrapper, target);
  
//   // 4. Move the target element inside the new wrapper
//   wrapper.appendChild(target);
// });
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
                delay: 0.3,
                y: -100,
                stagger: 0.03,
                duration: 1.8, 
                ease: 'power4.inOut' 
            }, '<');

        document.querySelector('.contact-flip').addEventListener('click', () => {
            openTl.play();
        });

         document.querySelector('.contact-close').addEventListener('click', () => {
             openTl.reverse();
         });
          document.querySelector('.contact-close-2').addEventListener('click', () => {
             openTl.reverse();
         });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && openTl.progress() > 0 && !openTl.reversed()) {
                openTl.reverse();
            }
        });

}
export default menu;