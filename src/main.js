import './styles.css'
import Lenis from 'lenis'
// import init from './misc'
import scrub from './misc.js';

import 'lenis/dist/lenis.css'
import menu from './menuReveal'
import Gradient from './gradient';

const gradient = new Gradient();
const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);




// brev()
scrub()
// init()
menu()


console.log("%cDesigned and built by https://namanprat.com", "background:blue;color:#fff;padding: 8px;");