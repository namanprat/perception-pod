import './styles.css'
import Lenis from 'lenis'
import misc from './misc'
import webgl from './webgl'
import 'lenis/dist/lenis.css'
import { Gradient } from './gradient'

const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
console.log(lenis);

webgl()
misc()
const gradient = new Gradient()
gradient.initGradient('#gradient-canvas')

console.log("%cDesigned and built by https://namanprat.com", "background:blue;color:#fff;padding: 8px;");
{/* <script type="module" src="https://perception-pod.netlify.app/main.js"></script> */}