// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { createCleanupRegistry, hasAnySelector } from './dom';

describe('dom helpers', () => {
    it('detects whether any selector exists in the current document', () => {
        document.body.innerHTML = `
            <div class="hero_contain"></div>
            <section class="scrub_wrap"></section>
        `;

        expect(hasAnySelector(['.missing', '.scrub_wrap'])).toBe(true);
        expect(hasAnySelector(['.missing', '.also-missing'])).toBe(false);
    });

    it('runs cleanup callbacks in reverse order', () => {
        const cleanupRegistry = createCleanupRegistry();
        const callbacks = [vi.fn(), vi.fn(), vi.fn()];

        callbacks.forEach((callback) => cleanupRegistry.add(callback));
        cleanupRegistry.run();

        expect(callbacks[2]).toHaveBeenCalledOnce();
        expect(callbacks[1]).toHaveBeenCalledOnce();
        expect(callbacks[0]).toHaveBeenCalledOnce();
    });
});
