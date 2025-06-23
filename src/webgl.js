import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


function webgl()
{
   
   
   // 1. Scene, Camera, and Renderer Setup
   // =================================================================
   const scene = new THREE.Scene();
   
   // <<< CHANGE: Find the container div
   const container = document.querySelector('#webgl');
   
   // <<< CHANGE: The renderer is created without a canvas reference
   const renderer = new THREE.WebGLRenderer({
       antialias: true,
       alpha: true // For a transparent background
   });
   
   // <<< CHANGE: The renderer's canvas (renderer.domElement) is appended to the container
   container.appendChild(renderer.domElement);
   
   // Use the container's dimensions for the camera and renderer
   const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
   camera.position.set(0, 1, 5);
   
   renderer.setSize(container.clientWidth, container.clientHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   
   
   // 2. Light Sources
   // =================================================================
   const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
   scene.add(ambientLight);
   
   const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
   directionalLight.position.set(5, 5, 5);
   scene.add(directionalLight);
   
   
   // 3. GLB Model Loader
   // =================================================================
   const loader = new GLTFLoader();
   const modelUrl = 'https://perception-pod.netlify.app/dry_flower.glb';
   
   loader.load(
       modelUrl,
       function (gltf) {
           const model = gltf.scene;
   
           // <<< CHANGE: Enlarge the model by 300%
           model.scale.set(10, 10, 10);
   
           // Center the model after scaling
           const box = new THREE.Box3().setFromObject(model);
           const center = box.getCenter(new THREE.Vector3());
           model.position.sub(center);
   
           scene.add(model);
           console.log("Model loaded and scaled successfully!");
       },
       (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
       (error) => { console.error('An error happened', error); }
   );
   
   
   // 4. Animation Loop
   // =================================================================
   function animate() {
       requestAnimationFrame(animate);
       renderer.render(scene, camera);
   }
   animate();
   
   
   // 5. Resize Handler
   // =================================================================
   window.addEventListener('resize', () => {
       // <<< CHANGE: Use container's dimensions for resizing
       camera.aspect = container.clientWidth / container.clientHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(container.clientWidth, container.clientHeight);
   });
}

export default webgl

