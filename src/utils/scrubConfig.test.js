import { describe, expect, it } from 'vitest';

import {
    buildFrameUrl,
    buildFrameUrls,
    inferAssetBaseUrl,
    normalizeBaseUrl,
    resolveScrubConfig,
} from './scrubConfig';

describe('scrubConfig', () => {
    it('normalizes trailing slashes from asset base urls', () => {
        expect(normalizeBaseUrl('https://cdn.example.com/assets///')).toBe(
            'https://cdn.example.com/assets'
        );
    });

    it('merges runtime overrides onto the default config', () => {
        expect(
            resolveScrubConfig({
                assetBaseUrl: 'https://cdn.example.com',
                eagerCount: '12',
                frameCount: '24',
            })
        ).toMatchObject({
            assetBaseUrl: 'https://cdn.example.com',
            eagerCount: 12,
            frameCount: 24,
            extension: 'png',
        });
    });

    it('builds absolute frame urls when a base url is configured', () => {
        const config = resolveScrubConfig({
            assetBaseUrl: 'https://cdn.example.com/perception',
            firstFrame: 5,
            frameCount: 3,
        });

        expect(buildFrameUrl(5, config)).toBe('https://cdn.example.com/perception/5.png');
        expect(buildFrameUrls(config)).toEqual([
            'https://cdn.example.com/perception/5.png',
            'https://cdn.example.com/perception/6.png',
            'https://cdn.example.com/perception/7.png',
        ]);
    });

    it('falls back to root-relative frame urls when no base url is configured', () => {
        const config = resolveScrubConfig({
            assetBaseUrl: 'https://perception-pod.netlify.app',
            firstFrame: 0,
            frameCount: 2,
        });

        expect(buildFrameUrls(config)).toEqual([
            'https://perception-pod.netlify.app/0.png',
            'https://perception-pod.netlify.app/1.png',
        ]);
    });

    it('infers the asset base url from the bundle url when available', () => {
        const previousWindow = globalThis.window;

        globalThis.window = {
            PerceptionPodConfig: {
                bundleUrl: 'https://cdn.example.com/assets/main.js',
            },
        };

        expect(inferAssetBaseUrl()).toBe('https://cdn.example.com/assets');

        globalThis.window = previousWindow;
    });
});
