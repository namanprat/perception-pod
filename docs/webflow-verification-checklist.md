# Webflow Verification Checklist

Run this checklist after each deploy/embed update because the live DOM is owned by Webflow rather than this repo.

## Before publishing

- Confirm the bundle URL used in Webflow points to the latest built `main.js`.
- Confirm any scrub-sequence asset configuration is still correct:
  - `data-asset-base-url`
  - `data-first-frame`
  - `data-frame-count`
  - `window.PerceptionPodConfig.scrub`

## Hero and nav

- Hero wordmark paths reveal correctly on initial load.
- Hero nav items animate in once and do not flicker.
- Sticky nav hides on hero and reappears after scrolling past the hero.
- Footer reveal hides nav and restores it when scrolling back up.

## Scrub section

- Preloader exits cleanly and re-enables page scroll.
- The first scrub frame renders before the section enters view.
- The frame sequence continues loading in the background without blocking interaction.
- Scrubbing through the section updates the canvas smoothly.
- Tooltip circles reveal progressively and pulse only once.
- Clicking a tooltip circle updates the header/body copy correctly.

## Cards and interactions

- Card hover tilt is smooth on desktop.
- Card flip works on click and closes when clicking outside the card.
- Returning to the tab does not leave cards stuck at an incorrect scale.
- Magnetic hover effects run only on desktop-sized layouts.

## Menus and content

- Contact modal opens from all trigger buttons and closes with the close button, arrow, and `Escape`.
- Hamburger menu flips open/closed correctly.
- FAQ rows expand/collapse correctly and only keep one answer open at a time.
- Smooth-scroll links still navigate to the intended Webflow sections.

## Final pass

- Test at least one desktop and one touch/mobile-sized viewport in Webflow preview or production.
- Check the browser console for missing selector or missing asset errors.
