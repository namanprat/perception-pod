import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function webgl()
{
   const scene = new THREE.Scene();
   // NOTE: For a transparent background, we don't set a scene.background color.
   
   // Get a reference to the canvas element from the HTML
   const canvas = document.querySelector('#webgl');
   
   // Sizes
   const sizes = {
       width: window.innerWidth,
       height: window.innerHeight
   };
   
   // Camera
   const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
   camera.position.z = 3;
   scene.add(camera);
   
   // Renderer
   const renderer = new THREE.WebGLRenderer({
       canvas: canvas,      // Use the existing canvas
       antialias: true,
       alpha: true          // <<< THIS IS THE KEY FOR A TRANSPARENT BACKGROUND
   });
   renderer.setSize(sizes.width, sizes.height);
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   
   // Controls (for mouse interaction)
   const controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true; // Makes the rotation smoother
   
   // =================================================================
   // 2. OBJECTS & LIGHTS
   // =================================================================
   
   // Cube
   const geometry = new THREE.BoxGeometry(1, 1, 1);
   const material = new THREE.MeshStandardMaterial({
       color: 0x0099ff, // A nice blue color
       metalness: 0.3,
       roughness: 0.4
   });
   const cube = new THREE.Mesh(geometry, material);
   scene.add(cube);
   
   // Lights
   const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
   scene.add(ambientLight);
   
   const pointLight = new THREE.PointLight(0xffffff, 0.8);
   pointLight.position.set(2, 3, 4);
   scene.add(pointLight);
   
   
   // =================================================================
   // 3. INTERACTIVITY (HOVER & CLICK)
   // =================================================================
   
   const raycaster = new THREE.Raycaster();
   const mouse = new THREE.Vector2();
   let currentIntersect = null; // To keep track of the currently hovered object
   
   // --- Update mouse coordinates on move ---
   window.addEventListener('mousemove', (event) => {
       // Normalize mouse coordinates to a range of -1 to +1
       mouse.x = (event.clientX / sizes.width) * 2 - 1;
       mouse.y = -(event.clientY / sizes.height) * 2 + 1;
   });
   
   // --- Handle clicks ---
   window.addEventListener('click', () => {
       // If the mouse is currently hovering over the cube...
       if (currentIntersect) {
           // ...change its material color to a random color
           cube.material.color.set(Math.random() * 0xffffff);
       }
   });
   
   
   // =================================================================
   // 4. ANIMATION LOOP
   // =================================================================
   
   const animate = () => {
       // Update controls
       controls.update();
   
       // --- Raycasting for Hover Effect ---
       // Cast a ray from the camera to the mouse position
       raycaster.setFromCamera(mouse, camera);
       const intersects = raycaster.intersectObjects([cube]);
   
       if (intersects.length > 0) {
           // If the mouse is intersecting the cube for the first time
           if (!currentIntersect) {
               cube.material.color.set(0xff6347); // Change to a tomato color
           }
           currentIntersect = intersects[0];
       } else {
           // If the mouse is no longer intersecting the cube
           if (currentIntersect) {
               // Change color back to the original blue
               cube.material.color.set(0x0099ff);
           }
           currentIntersect = null;
       }
   
       // Render the scene
       renderer.render(scene, camera);
   
       // Call animate again on the next frame
       window.requestAnimationFrame(animate);
   };
   
   // Start the animation loop
   animate();
   
   
   // =================================================================
   // 5. RESIZE HANDLER
   // =================================================================
   window.addEventListener('resize', () => {
       // Update sizes
       sizes.width = window.innerWidth;
       sizes.height = window.innerHeight;
   
       // Update camera aspect ratio
       camera.aspect = sizes.width / sizes.height;
       camera.updateProjectionMatrix();
   
       // Update renderer
       renderer.setSize(sizes.width, sizes.height);
       renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   });
}

export default webgl

