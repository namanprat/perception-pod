import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function setupModelViewer() {
  const container = document.getElementById('model');
  if (!container) {
    console.error("Initialization failed: No element with ID 'model' found.");
    return;
  }

  // 1. Renderer Setup
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  // --- ENHANCEMENT: Enable shadow mapping for realistic shadows ---
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer, more realistic shadows

  container.appendChild(renderer.domElement);

  // 2. Scene and Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 12); // Adjusted camera position for a better initial view

  // 3. Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true; // --- ENHANCEMENT: Add a subtle auto-rotation ---
  controls.autoRotateSpeed = 0.5;

  // 4. Lighting and Environment
  new UltraHDRLoader().load(
    'https://perception-pod.netlify.app/enviornment.hdr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      // --- ENHANCEMENT: Make the environment visible as the background ---
      scene.background = texture;
      console.log('UltraHDR environment loaded.');
    },
    undefined,
    (err) => console.error('Failed to load UltraHDR environment:', err)
  );
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 15); // Increased intensity slightly
  directionalLight.position.set(0, 2, 2);
  // --- ENHANCEMENT: Configure the light to cast shadows ---
  // directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048; // Higher resolution for sharper shadows
  directionalLight.shadow.mapSize.height = 2048;
  // --- ENHANCEMENT: Adjust the shadow camera frustum to fit the scene ---

  
  scene.add(directionalLight);
  
  // Add an ambient light to soften shadows slightly
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);


  // 5. Model Loading (without Draco)
  const gltfLoader = new GLTFLoader();

  gltfLoader.load(
    'https://perception-pod.netlify.app/flower6.glb',
    (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          // --- ENHANCEMENT: Enable shadow casting on the model ---
          child.castShadow = true;
          
          if (child.material) {
            // This fix is specific to models with transparency issues
            child.material.transparent = true;
            child.material.depthWrite = false;
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
      });
      
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      model.position.sub(center);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 6; // Slightly larger for better presence
      const scale = desiredSize / maxDim;
      model.scale.set(scale, scale, scale);
      
      // --- ENHANCEMENT: Add a ground plane to receive shadows ---
      // We do this here so we can place it relative to the loaded model's size
      const groundGeometry = new THREE.CircleGeometry(8, 64); // A circular ground plane
      // ShadowMaterial only receives shadows, making it 'invisible'
      const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
      
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.receiveShadow = true;
      ground.rotation.x = -Math.PI / 2;
      // Position the ground just below the model
      ground.position.y = box.min.y * scale - 0.01;
      
      scene.add(ground);
      
      controls.target.set(0, 0, 0);
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
    controls.update(); // Important for damping and auto-rotate
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

export default setupModelViewer;