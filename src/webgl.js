import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function setupModelViewer() {
  const container = document.getElementById('model');
  if (!container) {
    console.error("Initialization failed: No element with ID 'model' found.");
    return;
  }

  // Basic renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  // Basic controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Basic lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // JSON Scene Loading
  const objectLoader = new THREE.ObjectLoader();

  async function loadJSONScene() {
    try {
      // Replace with your JSON file path
      const response = await fetch('https://perception-pod.netlify.app/project.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      // Debug: Log the JSON structure
      console.log('JSON data:', jsonData);
      
      // Check if the JSON has the expected structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid JSON data structure');
      }
      
      // Parse the JSON data
      const loadedObject = objectLoader.parse(jsonData);
      scene.add(loadedObject);
      
      console.log('Scene loaded successfully');
      
    } catch (error) {
      console.error('JSON scene loading error:', error);
      
      // Fallback: create a simple cube for testing
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      console.log('Fallback cube added');
    }
  }

  // Load the JSON scene
  loadJSONScene();

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

export default setupModelViewer;