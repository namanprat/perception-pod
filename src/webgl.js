import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

function brev()
{
const container = document.getElementById('model');

// Create the scene
const scene = new THREE.Scene();

// Create the camera
const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
// Position the camera a bit further back to see the model better
camera.position.z = 5;

// --- MOUSE PARALLAX SETUP ---
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;
}

container.addEventListener('mousemove', onMouseMove);
// --- END OF PARALLAX SETUP ---

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

container.appendChild(renderer.domElement);

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://perception-pod.netlify.app/enviornment.hdr',
    (texture) => {
        texture.flipY = false;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;

        texture.dispose();
        pmremGenerator.dispose();
    },
    undefined,
    (error) => {
        console.error("An error occurred loading the HDR environment map.", error);
    }
);

let model;

const loader = new GLTFLoader();
loader.load(
    'https://perception-pod.netlify.app/dry_flower.glb',
    (gltf) => {
        model = gltf.scene;
        console.log("Model loaded successfully.");

        // Calculate bounding box for centering
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredSize = 2;
        const finalScale = desiredSize / maxDim;

        // --- INITIAL STATE: Show only top/petals, zoomed in ---
        // Start scaled down for entrance animation
        model.scale.set(0, 0, 0);
        
        // Position to show top/petals (assuming petals are at the top)
        // We'll position the model lower so the top/petals are centered, and zoom in more
        const petalFocusY = center.y + (size.y * 3); // Focus on top petals
        model.position.set(-center.x, -petalFocusY, -center.z);

        scene.add(model);
        console.log("Model added to scene, starting animation.");

        // --- ENTRANCE ANIMATION ---
        const entranceTl = gsap.timeline({ defaults: { duration: 3, ease: "power4.inOut" }});

        // Scale up and position for petal focus (zoomed in)
        const petalScale = finalScale * 2.25; // Zoom in to show top/petals
        
        entranceTl.to(model.scale, {
            delay: 1,
            x: petalScale,
            y: petalScale,
            z: petalScale,
        }, 0);

        entranceTl.to(model.position, {
            x: -center.x,
            y: -petalFocusY, // Focus on petals/top
            z: -center.z,
        }, "<");

        // --- SCROLL-TRIGGERED ANIMATION ---
        // This will trigger when the sticky container reaches the top
        ScrollTrigger.create({
            trigger: container.parentElement, // The container that's 350vh
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // Smooth scrubbing, 1 second lag
            onUpdate: (self) => {
                if (model) {
                    const progress = self.progress;
                    
                    // 180 degree rotation on Y-axis (left-right)
                    const targetRotationY = progress * Math.PI; // 180 degrees in radians
                    model.rotation.y = targetRotationY;
                    
                    // Zoom out: interpolate from petal scale to final scale
                    const currentScale = gsap.utils.interpolate(petalScale, finalScale, progress);
                    model.scale.set(currentScale, currentScale, currentScale);
                    
                    // Move to center: interpolate from petal focus to center
                    const currentY = gsap.utils.interpolate(-petalFocusY, -center.y, progress);
                    model.position.y = currentY;
                    
                    // Keep X and Z centered
                    model.position.x = -center.x;
                    model.position.z = -center.z;
                }
            }
        });

    },
    undefined,
    (error) => {
        console.error('An error happened during loading:', error);
    }
);

function animate() {
    requestAnimationFrame(animate);

    // --- PARALLAX EFFECT (CONTINUES THROUGHOUT) ---
    if (camera) {
        const parallaxIntensity = 1;
        const targetX = mouse.x * parallaxIntensity;
        const easing = 0.05;
        camera.position.x += (targetX - camera.position.x) * easing;
        camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
}
animate();

// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    ScrollTrigger.refresh(); // Refresh ScrollTrigger on resize
});
}
export default brev