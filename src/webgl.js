import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js';


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

  container.appendChild(renderer.domElement);

  // 2. Scene and Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 12);

  const hdrLoader = new UltraHDRLoader();
hdrLoader.load('https://perception-pod.netlify.app/san_giuseppe_bridge_2k.jpg', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdr;
  scene.environment = hdr;
});

  // 3. Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // 4. Lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 15);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // 5. Model Loading
  const gltfLoader = new GLTFLoader();

  gltfLoader.load(
    'https://perception-pod.netlify.app/flower6.glb',
    (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            // Handle transparency issues
            if (child.material.transparent || child.material.opacity < 1) {
              child.material.transparent = true;
              child.material.depthWrite = false;
              child.material.side = THREE.DoubleSide;
            }
            child.material.needsUpdate = true;
          }
        }
      });
      
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      model.position.sub(center);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 6;
      const scale = desiredSize / maxDim;
      model.scale.set(scale, scale, scale);
      
      controls.target.set(0, 0, 0);
      controls.update();

      scene.add(model);
      console.log('Model loaded and added to the scene.');
    },
    (xhr) => {
      if (xhr.total > 0) {
        console.log(`Model loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
      }
    },
    (error) => {
      console.error('An error happened while loading the model:', error);
    }
  );

  // 6. Render Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
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