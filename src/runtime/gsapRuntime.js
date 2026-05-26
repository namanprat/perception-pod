import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const globalScope = typeof window !== 'undefined' ? window : globalThis;
let splitTextRegistered = false;

gsap.registerPlugin(Flip, ScrollToPlugin, ScrollTrigger);

if (typeof window !== 'undefined') {
    window.gsap ??= gsap;
    window.Flip ??= Flip;
    window.ScrollToPlugin ??= ScrollToPlugin;
    window.ScrollTrigger ??= ScrollTrigger;
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
