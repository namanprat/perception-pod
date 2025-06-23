import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function webgl()
{

   
   // 1. SCENE SETUP (Unchanged)
   // =================================================================
   const scene = new THREE.Scene();
   scene.background = new THREE.Color(0xdddddd);
   
   // 2. CAMERA SETUP (Unchanged)
   // =================================================================
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
   camera.position.set(0, 1, 5);
   
   // 3. RENDERER SETUP (*** MODIFIED ***)
   // =================================================================
   // Get a reference to the canvas element from the HTML
   const canvas = document.querySelector('#webgl');
   
   // Pass the canvas to the renderer in its constructor options
   const renderer = new THREE.WebGLRenderer({
       canvas: canvas,
       antialias: true
   });
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   
   // We DON'T need to append the renderer.domElement to the body anymore,
   // because we are already using the canvas from the HTML.
   
   // 4. LIGHTING (Unchanged)
   // =================================================================
   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
   scene.add(ambientLight);
   const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
   directionalLight.position.set(5, 10, 7.5);
   scene.add(directionalLight);
   
   // 5. CONTROLS (Unchanged)
   // =================================================================
   // Note: renderer.domElement is the same as our 'canvas' variable here.
   const controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true;
   controls.dampingFactor = 0.05;
   
   // 6. MODEL LOADER (Unchanged)
   // =================================================================
   const loader = new GLTFLoader();
   loader.load('./dry_flower.glb', (gltf) => {
       const model = gltf.scene;
       const box = new THREE.Box3().setFromObject(model);
       const center = box.getCenter(new THREE.Vector3());
       const size = box.getSize(new THREE.Vector3());
       model.position.sub(center);
       const maxDim = Math.max(size.x, size.y, size.z);
       const scale = 3.0 / maxDim;
       model.scale.multiplyScalar(scale);
       scene.add(model);
       console.log('Model loaded successfully!');
   }, (xhr) => {
       console.log((xhr.loaded / xhr.total * 100) + '% loaded');
   }, (error) => {
       console.error('An error happened while loading the model:', error);
   });
   
   // 7. ANIMATION LOOP (Unchanged)
   // =================================================================
   function animate() {
       requestAnimationFrame(animate);
       controls.update();
       renderer.render(scene, camera);
   }
   animate();
   
   // 8. RESIZE HANDLER (Unchanged)
   // =================================================================
   window.addEventListener('resize', onWindowResize, false);
   function onWindowResize() {
       camera.aspect = window.innerWidth / window.innerHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(window.innerWidth, window.innerHeight);
   }

}

export default webgl

