import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function webgl()
{
   
   // 1. Scene, Camera, and Renderer
   // =================================================================
   const scene = new THREE.Scene();
   
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.z = 5; // Move camera back so we can see the object
   
   const renderer = new THREE.WebGLRenderer({
       canvas: document.querySelector('#webgl'),
       alpha: true // For a transparent background
   });
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   
   
   // 2. A single light source
   // =================================================================
   // Without any light, the model will appear black.
   const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
   scene.add(ambientLight);
   
   
   // 3. GLB Model Loader
   // =================================================================
   const loader = new GLTFLoader();
   const modelUrl = 'https://perception-pod.netlify.app/dry_flower.glb'; // <<< CHANGE THIS TO YOUR MODEL'S FILENAME
   
   loader.load(
       // resource URL
       modelUrl,
       // called when the resource is loaded
       function (gltf) {
           // The loaded model is in gltf.scene
           scene.add(gltf.scene);
   
           console.log("Model loaded successfully!");
   
           // IMPORTANT: The model might be very large, very small, or off-center.
           // You may need to manually adjust the camera.position or add scaling/centering
           // code here if you don't see anything.
           // For example:
           // gltf.scene.scale.set(0.1, 0.1, 0.1);
       },
       // The other loader functions (onProgress, onError) are optional
   );
   
   
   // 4. Animation Loop
   // =_================================================================
   // This function will be called on every frame to re-render the scene.
   function animate() {
       requestAnimationFrame(animate);
       renderer.render(scene, camera);
   }
   
   // Start the animation loop
   animate();
   
   
   // 5. Basic Resize Handler
   // =================================================================
   window.addEventListener('resize', () => {
       camera.aspect = window.innerWidth / window.innerHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(window.innerWidth, window.innerHeight);
   });
}

export default webgl

