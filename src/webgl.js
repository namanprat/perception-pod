import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


function webgl() {
  // --- Boilerplate remains the same ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('#model'),
      antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const loader = new GLTFLoader();
  
  loader.load(
      'https://perception-pod.netlify.app/dry_flower.glb',
      function (gltf) {
          const model = gltf.scene;

          // ================================================================
          // THE KEY CHANGE IS HERE: We calculate everything up front.
          // ================================================================

          // --- 1. Calculate the model's "base" size (at scale 1) ---
          model.scale.set(1, 1, 1); // Temporarily set scale to 1 for accurate measurement
          const modelBox = new THREE.Box3().setFromObject(model);
          const baseSize = modelBox.getSize(new THREE.Vector3());
          const baseModelHeight = baseSize.y;

          // --- 2. Calculate the viewport's visible height in the 3D scene ---
          const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
          
          // --- 3. Calculate the MAXIMUM scale the model can be to fit perfectly ---
          const maxFitScale = visibleHeight / baseModelHeight;

          // --- 4. Define your desired animation scales ---
          const initialScale = 10;
          const desiredFinalScale = initialScale * 0.8;

          // --- 5. Determine the "safe" final scale for the animation ---
          // It's the smaller value between what you WANT and what FITS.
          const safeFinalScale = Math.min(desiredFinalScale, maxFitScale);

          // --- Now, apply the initial scale to the model for the start of the animation ---
          model.scale.set(initialScale, initialScale, initialScale);

          // --- Use the initial height for the peeking calculation ---
          const initialModelHeight = baseModelHeight * initialScale;
          const peekAmount = 0.;
          const bottomOfScreenY = -visibleHeight / 2;
          model.position.y = bottomOfScreenY - (initialModelHeight / 2) + (initialModelHeight * peekAmount);
          
          scene.add(model);
          
          // --- GSAP Animation (now using our calculated `safeFinalScale`) ---
          const tl = gsap.timeline({
              scrollTrigger: {
                  trigger: ".animation-section",
                  start: "top bottom",
                  end: "bottom bottom",
                  scrub: 1,
              },
          });
          
          tl.to(model.position, {
              y: 0,
          })
          .to(model.scale, {
              // Animate to the guaranteed-to-fit scale
              x: safeFinalScale,
              y: safeFinalScale,
              z: safeFinalScale,
          }, "<");

      },
      undefined, 
      function (error) {
          console.error('An error happened while loading the GLB model:', error);
      }
  );

  // --- Render loop and resize handler remain the same ---
  function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
  }
  animate();
  
  window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // NOTE: For a truly robust solution, you would re-run the scale 
      // calculation logic here on resize. For now, this works on load.
  });
}

export default webgl;