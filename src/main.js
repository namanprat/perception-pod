import './styles.css'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import initPageRuntime from './misc.js';
import menu from './menuReveal'
import Gradient from './gradient';
import { gsap, ScrollTrigger } from './runtime/gsapRuntime';
import { createCleanupRegistry, hasAnySelector, onDomReady } from './utils/dom';

function initSmoothScroll() {
  const lenis = new Lenis();
  const updateScrollTrigger = () => ScrollTrigger.update();
  const handleTick = (time) => {
    lenis.raf(time * 1000);
  };

  lenis.on('scroll', updateScrollTrigger);
  gsap.ticker.add(handleTick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    lenis.off('scroll', updateScrollTrigger);
    gsap.ticker.remove(handleTick);
    lenis.destroy();
  };
}

onDomReady(() => {
  const cleanupRegistry = createCleanupRegistry();

  if (document.getElementById('gradient')) {
    const gradient = new Gradient();
    cleanupRegistry.add(() => gradient.destroy());
  }

  if (hasAnySelector(['.hero_contain', '.scrub_wrap', '.reveal_wrap'])) {
    cleanupRegistry.add(initSmoothScroll());
  }

  cleanupRegistry.add(initPageRuntime());

  if (hasAnySelector(['.contact_wrap', '.contact-flip', '.contact-flip-2', '.contact-flip-3'])) {
    cleanupRegistry.add(menu());
  }

  window.addEventListener(
    'pagehide',
    () => {
      cleanupRegistry.run();
    },
    { once: true }
  );
});


// console.log("%cDesigned and built by https://duforn.com", "background:black;color:#fff;padding: 12px;");