import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// 1. Import GSAP
import gsap from 'gsap';


function webgl() {
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

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true // Make the canvas transparent
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
        'https://perception-pod.netlify.app/enviornment.hdr', // A neutral studio HDR file
        (texture) => {
            // FIX: Add this line to prevent the WebGL warning.
            texture.flipY = false;

            // The texture needs to be processed to be used as an environment map
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;

            // Set the environment map for the entire scene
            scene.environment = envMap;

            // Clean up to free memory
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

            // --- Calculate final position and scale ---
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const desiredSize = 3;
            const finalScale = desiredSize / maxDim;
            const finalPosition = { x: -center.x, y: -center.y, z: -center.z };

            // --- 2. Set the INITIAL state for the animation ---
            // Start scaled down to nothing
            model.scale.set(0, 0, 0);
            // Start below its final centered position
            model.position.set(finalPosition.x, finalPosition.y - 1, finalPosition.z);

            scene.add(model);
            console.log("Model added to scene, starting animation.");

            // --- 3. Animate to the FINAL state with GSAP ---
            // Animate the scale
            gsap.to(model.scale, {
                delay: 3,
                x: finalScale,
                y: finalScale,
                z: finalScale,
                duration: 2.5, // 2 seconds
                ease: "power4.inOut",
            }, "<");

            // Animate the position
            gsap.to(model.position, {
                x: finalPosition.x,
                y: finalPosition.y,
                z: finalPosition.z,
                duration: 2.5, // Slightly longer duration for a nice effect
                ease: "power4.inOut",
            }, "<");
        },
        undefined,
        (error) => {
            console.error('An error happened during loading:', error);
        }
    );


    function animate() {
        requestAnimationFrame(animate);

        // if (model) {
        //     model.rotation.y += 0.003;
        // }

        renderer.render(scene, camera);
    }
    animate();

    // --- RESIZE HANDLER ---
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

export default webgl;