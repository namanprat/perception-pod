import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function setupModelViewer() {
  const container = document.getElementById('model');
  if (!container) {
    console.error("Initialization failed: No element with ID 'model' found.");
    return;
  }

  // 1. Renderer Setup (for Highest Quality)
  const renderer = new THREE.WebGLRenderer({
    antialias: true, // Smooths edges
    alpha: true      // Allows for a transparent background
  });
  renderer.setPixelRatio(window.devicePixelRatio); // Render at native screen resolution
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace; // Ensures correct color output
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic tone mapping for realistic lighting
  renderer.toneMappingExposure = 1.0; // Adjust exposure for brightness
  container.appendChild(renderer.domElement);

  // 2. Scene and Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50, // A slightly narrower field of view can feel more cinematic
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10); // Set a default distance

  // 3. Controls for Interaction (OrbitControls)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Adds a smooth, inertia-like effect to rotation
  // controls.autoRotate = false; // By default, this is false. Explicitly set or remove the line.

  // 4. Lighting and Environment
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load(
    'https://perception-pod.netlify.app/enviornment.hdr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      console.log('HDR environment loaded.');
    },
    undefined,
    (err) => console.error('Failed to load HDR environment:', err)
  );
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // 5. Model Loading (with Draco)
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load(
    'https://perception-pod.netlify.app/flower6.glb',
    (gltf) => {
      const model = gltf.scene;

      // Automatically center and scale the model
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - center.y);
      model.position.z += (model.position.z - center.z);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 5;
      const scale = desiredSize / maxDim;
      model.scale.set(scale, scale, scale);
      
      // Update the controls to target the new model center
      controls.target.copy(center.multiplyScalar(scale));
      controls.update();

      scene.add(model);
      console.log('Model loaded and added to the scene.');
    },
    (xhr) => {
      console.log(`Model loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
      console.error('An error happened while loading the model:', error);
    }
  );

  // 6. Render Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required for damping to take effect
    renderer.render(scene, camera);
  }
  animate();

  // 7. Handle Window Resizing
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// Run the setup function
setupModelViewer();

// Export for use in modules if needed
export default setupModelViewer;