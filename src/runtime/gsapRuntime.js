import { gsap as importedGsap } from 'gsap';
import { Flip as importedFlip } from 'gsap/Flip';
import { ScrollToPlugin as importedScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger as importedScrollTrigger } from 'gsap/ScrollTrigger';

const globalScope = typeof window !== 'undefined' ? window : globalThis;
let splitTextRegistered = false;

const gsap = globalScope.gsap ?? importedGsap;
const Flip = globalScope.Flip ?? importedFlip;
const ScrollToPlugin = globalScope.ScrollToPlugin ?? importedScrollToPlugin;
const ScrollTrigger = globalScope.ScrollTrigger ?? importedScrollTrigger;

gsap.registerPlugin(Flip, ScrollToPlugin, ScrollTrigger);

if (typeof window !== 'undefined') {
    window.gsap = gsap;
    window.Flip = Flip;
    window.ScrollToPlugin = ScrollToPlugin;
    window.ScrollTrigger = ScrollTrigger;
}

export function getSplitText() {
    const SplitText = globalScope.SplitText ?? null;

    if (SplitText && !splitTextRegistered) {
        gsap.registerPlugin(SplitText);
        splitTextRegistered = true;
    }

    return SplitText;
}

export { gsap, Flip, ScrollToPlugin, ScrollTrigger };
