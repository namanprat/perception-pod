export { initScrubSequence as scrub } from './features/scrubSequence';
export { initTooltipSystem as initTooltipAnimations } from './features/tooltipSystem';

import { initScrubSequence } from './features/scrubSequence';
import { initTooltipSystem } from './features/tooltipSystem';

export default {
    scrub: initScrubSequence,
    initTooltipAnimations: initTooltipSystem,
};