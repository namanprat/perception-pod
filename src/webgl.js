import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


gsap.registerPlugin(ScrollTrigger);

function webgl() {
    const scene = new THREE.Scene();
    const container = document.querySelector(".webgl");
    if (!container) return;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(1, 2, 3);
    scene.add(mainLight);

    let model;
    const loader = new GLTFLoader();
    const modelUrl = 'https://perception-pod.netlify.app/dry_flower.glb';

    loader.load(modelUrl, (gltf) => {
        model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.0 / maxDim;
        model.scale.multiplyScalar(scale);
        model.position.sub(center);

        // Initial "peeking" state
        model.position.y = -2.5;

        scene.add(model);
        
        setupScrollAnimations(model);
        animate();
    });
    
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    window.addEventListener("resize", () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/**
 * Sets up the simplified scroll animations.
 * @param {THREE.Group} model - The loaded 3D model.
 */
function setupScrollAnimations(model) {
    // --- TIMELINE 1: KEEPS THE ZOOM ON SCROLL ---
    // This part remains unchanged.
    gsap.timeline({
        scrollTrigger: {
            trigger: ".section-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
        }
    })
    .to(model.position, { y: 0, ease: "power1.inOut" })
    .to(model.scale, { x: 2, y: 2, z: 2, ease: "power1.inOut" }, "<");

    // --- ANIMATION 2: KEEPS THE TEXT REVEAL ---
    // The dissection logic has been removed.
    // This is now a standalone animation for the text elements.
    gsap.to([".text-left", ".text-right"], { // Target both text elements in an array
        opacity: 1,
        ease: "power1.in",
        scrollTrigger: {
            trigger: ".section-dissect",
            start: "top center", // Start fading in when the section top hits the screen center
            end: "center bottom",// Fully faded in by the time the center hits the bottom
            scrub: true,
        }
    });
}

export default webgl;