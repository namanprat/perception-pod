function scrub() {
  var Webflow = Webflow || []

  // Wait for Webflow to be ready before running the script
  Webflow.push(function () {

    // Get the main wrapper element that holds all configuration attributes
    const component = document.querySelector('[image-scrubbing = component]')

    // Extract the image URLs from a semicolon-separated attribute
    const imageURLs = document.querySelector('[image-scrubbing-urls]')
      .getAttribute('image-scrubbing-urls')
      .split(';')
      .filter(url => url.trim()) // Remove empty strings

    // Initialize the image scrubbing animation
    imageSequence({
      imageURLs,
      canvas: '[image-scrubbing = component] canvas',
      // clear: true, // enable only if your images have transparency

      // Optional responsive object-fit values
      fitMode: {
        base: component.getAttribute('image-scrubbing-fit'),
        landscape: component.getAttribute('image-scrubbing-fit-landscape'),
        portrait: component.getAttribute('image-scrubbing-fit-portrait'),
      },

      // Use provided FPS or fallback to 24
      fps: parseInt(component.getAttribute('image-scrubbing-fps')) || 24,

      // ScrollTrigger configuration with fallbacks
      scrollTrigger: {
        trigger: component,
        start: component.getAttribute('image-scrubbing-start-point') || 'top top',
        end: component.getAttribute('image-scrubbing-end-point') || 'bottom bottom',
        scrub: true
      }
    })

    /**
     * Draws an image sequence onto a <canvas> synced with scroll position.
     */
    function imageSequence(config) {

      let playhead = { frame: 0 }
      let canvas = gsap.utils.toArray(config.canvas)[0] || console.warn('canvas not defined')
      let ctx = canvas.getContext('2d')
      let curFrame = -1
      let onUpdate = config.onUpdate
      let images

      // Resize the canvas according to device pixel ratio
      const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1
        canvas.width = canvas.clientWidth * dpr
        canvas.height = canvas.clientHeight * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }

      // Draw the current image frame based on scroll position
      const updateImage = function () {
        let frame = Math.round(playhead.frame)

        // Redraw if the frame changed or the canvas was resized
        if (frame !== curFrame || !canvas._hasHighResSetup) {
          if (!canvas._hasHighResSetup) {
            resizeCanvas()
            canvas._hasHighResSetup = true
          }

          // Clear the canvas if 'clear' is enabled
          config.clear && ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

          const img = images[frame]
          const canvasWidth = canvas.clientWidth
          const canvasHeight = canvas.clientHeight
          const canvasRatio = canvasWidth / canvasHeight
          const imgRatio = img.naturalWidth / img.naturalHeight

          let drawWidth, drawHeight

          // Determine the appropriate fit mode based on current orientation
          function getResponsiveFit() {
            const isPortrait = window.matchMedia('(orientation: portrait)').matches
            const isLandscape = window.matchMedia('(orientation: landscape)').matches

            if (isPortrait && config.fitMode.portrait) return config.fitMode.portrait
            if (isLandscape && config.fitMode.landscape) return config.fitMode.landscape

            return config.fitMode.base || 'contain'
          }

          const fitMode = getResponsiveFit()

          // Calculate image size according to 'contain' or 'cover'
          if (fitMode === 'contain') {
            if (imgRatio > canvasRatio) {
              drawWidth = canvasWidth
              drawHeight = canvasWidth / imgRatio
            } else {
              drawHeight = canvasHeight
              drawWidth = canvasHeight * imgRatio
            }
          } else if (fitMode === 'cover') {
            if (imgRatio > canvasRatio) {
              drawHeight = canvasHeight
              drawWidth = canvasHeight * imgRatio
            } else {
              drawWidth = canvasWidth
              drawHeight = canvasWidth / imgRatio
            }
          }

          // Center the image within the canvas
          const offsetX = (canvasWidth - drawWidth) / 2
          const offsetY = (canvasHeight - drawHeight) / 2

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

          curFrame = frame
          onUpdate && onUpdate.call(this, frame, img)
        }
      }

      // Preload all images and trigger initial render when the first is ready
      images = config.imageURLs.map((url, i) => {
        let img = new Image()
        img.src = url
        i || (img.onload = updateImage)
        return img
      })

      // Redraw when canvas dimensions change
      new ResizeObserver(() => {
        canvas._hasHighResSetup = false
        updateImage()
      }).observe(canvas)

      // Create a timeline for the animation with extended last frame
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: config.scrollTrigger.trigger,
          start: config.scrollTrigger.start,
          end: config.scrollTrigger.end,
          scrub: true
        }
      })

      // Animation for the main sequence (80% of the scroll)
      tl.to(playhead, {
        frame: images.length - 1,
        ease: 'none',
        onUpdate: updateImage,
        duration: 0.8 // 80% of the timeline
      })

      // Hold the last frame for the remaining 20% (50vh out of 250vh total)
      tl.to(playhead, {
        frame: images.length - 1,
        ease: 'none',
        duration: 0.2 // 20% of the timeline
      })

      return tl
    }
  })
}

export default scrub