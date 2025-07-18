gsap.registerPlugin(ScrollTrigger);

function scrub()
{
gsap.registerPlugin(ScrollTrigger);
        
        // Generate image URLs array
        const imageUrls = [];
        for (let i = 1; i <= 100; i++) {
            imageUrls.push(`https://perception-pod.netlify.app/${i}.png`);
        }
        
        // Canvas setup with error handling
        let canvas = document.getElementById('pp-scrub');
        
        // If canvas doesn't exist, create it dynamically
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'pp-scrub';
            const container = document.querySelector('.scrub_contain');
            if (container) {
                container.appendChild(canvas);
            }
        }
        
        // Try to get context with fallback
        let ctx;
        try {
            ctx = canvas.getContext('2d');
        } catch (error) {
            console.error('Canvas context error:', error);
            // Fallback: create new canvas element
            canvas = document.createElement('canvas');
            canvas.id = 'pp-scrub';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            
            const container = document.querySelector('.scrub_contain');
            if (container) {
                container.innerHTML = '';
                container.appendChild(canvas);
            }
            
            ctx = canvas.getContext('2d');
        }
        
        // Set canvas size with safety check
        function resizeCanvas() {
            if (canvas && ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        }
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resizeCanvas);
        } else {
            resizeCanvas();
        }
        
        window.addEventListener('resize', resizeCanvas);
        
        // Image sequence object
        const imageSequence = {
            frame: 0,
            images: [],
            imagesLoaded: 0,
            totalImages: imageUrls.length
        };
        
        // Preload images
        function preloadImages() {
            imageUrls.forEach((url, index) => {
                const img = new Image();
                img.onload = () => {
                    imageSequence.imagesLoaded++;
                    if (imageSequence.imagesLoaded === imageSequence.totalImages) {
                        initScrollTrigger();
                    }
                };
                img.src = url;
                imageSequence.images[index] = img;
            });
        }
        
        // Draw current frame
        function drawFrame() {
            const currentFrame = Math.floor(imageSequence.frame);
            const img = imageSequence.images[currentFrame];
            
            if (img && img.complete && ctx) {
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate scaling to cover entire frame height (like CSS object-fit: cover)
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                
                // Center the image
                const x = (canvas.width - scaledWidth) / 2;
                const y = (canvas.height - scaledHeight) / 2;
                
                // Draw image
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                
                // Create fade to transparent gradient for bottom 10vh
                const fadeHeight = canvas.height * 0.1; // 10vh
                const fadeStartY = canvas.height - fadeHeight;
                
                // Create gradient from transparent to opaque black
                const gradient = ctx.createLinearGradient(0, fadeStartY, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at top of fade
                gradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Opaque black at bottom
                
                // Apply gradient as mask using composite operation
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, fadeStartY, canvas.width, fadeHeight);
                
                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
            }
        }
        
        // Initialize ScrollTrigger
        function initScrollTrigger() {
            // Draw initial frame
            drawFrame();
            
            // Create ScrollTrigger animation
            gsap.to(imageSequence, {
                frame: imageSequence.totalImages - 1,
                snap: "frame",
                ease: "none",
                scrollTrigger: {
                    trigger: ".scrub_wrap",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 0.5,
                    onUpdate: () => drawFrame()
                }
            });
            
            console.log('Image sequence initialized with', imageSequence.totalImages, 'images');
        }
        
        // Start loading images
        preloadImages();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            resizeCanvas();
            drawFrame();
        });
}
export default scrub