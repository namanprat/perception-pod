import './styles.css'
import Lenis from 'lenis'
import misc from './misc'
import scrub from './scrub';

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
misc()
menu()


console.log("%cDesigned and built by https://namanprat.com", "background:blue;color:#fff;padding: 8px;");