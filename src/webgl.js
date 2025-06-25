// webgl.js

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Make this an async function to use await
export default async function webgl() {
    // --- 1. CORE SETUP ---
    const container = document.getElementById('model');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // --- 2. LIGHTING ---
    new RGBELoader().load('https://perception-pod.netlify.app/envirornment.hdr', (texture) => {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    });

    // --- 3. MODEL LOADING ---
    // Use a promise to know when the model is fully loaded
    const loadModel = new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            'https://perception-pod.netlify.app/dry_flower.glb',
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);
                resolve(model); // Resolve the promise with the loaded model
            },
            undefined,
            (error) => reject(error)
        );
    });

    // Wait for the model to finish loading
    const model = await loadModel;

    // --- 4. RESIZE HANDLER ---
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- 5. RETURN ESSENTIALS ---
    // Return everything needed to control the scene from outside
    return { scene, camera, renderer, model };
}