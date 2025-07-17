import * as THREE from 'three';
import * as POSTPROCESSING from "postprocessing"
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
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = false;
  renderer.physicallyCorrectLights = true;

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

  // 3. Post-processing Setup
  const composer = new POSTPROCESSING.EffectComposer(renderer);

  // Add a render pass for the main scene
  const renderPass = new POSTPROCESSING.RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Enhanced realistic post-processing effects (using only available effects)
  const bloomEffect = new POSTPROCESSING.BloomEffect({
    intensity: 0.4,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.1
  });

  // Simple tone mapping
  const toneMapEffect = new POSTPROCESSING.ToneMappingEffect({
    mode: POSTPROCESSING.ToneMappingMode.ACES_FILMIC
  });

  // Add subtle noise for film-like quality
  const noiseEffect = new POSTPROCESSING.NoiseEffect({
    premultiply: true,
    blendFunction: POSTPROCESSING.BlendFunction.SCREEN
  });
  noiseEffect.blendMode.opacity.value = 0.05;

  const effectPass = new POSTPROCESSING.EffectPass(camera, 
    toneMapEffect, 
    bloomEffect, 
    noiseEffect
  );
  composer.addPass(effectPass);

  // 4. HDR Environment
  const hdrLoader = new UltraHDRLoader();
  hdrLoader.load('https://perception-pod.netlify.app/san_giuseppe_bridge_2k.jpg', (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = hdr;
    scene.environment = hdr;
  });

  // 5. Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI * 0.75;

  // 6. Realistic Lighting Setup
  // Key light - main directional light
  const keyLight = new THREE.DirectionalLight(0xff8a96, 3);
  keyLight.position.set(5, 5, 2);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Fill light - softer secondary light
  const fillLight = new THREE.DirectionalLight(0xff8a96, 1);
  fillLight.position.set(-5, 8, -5);
  fillLight.castShadow = false;
  scene.add(fillLight);

  // Rim light - for edge definition
  const rimLight = new THREE.DirectionalLight(0xff8a96, 2);
  rimLight.position.set(0, 5, -10);
  rimLight.castShadow = false;
  scene.add(rimLight);

  // Ambient light - soft global illumination
  const ambientLight = new THREE.AmbientLight(0xff8a96, 0.4);
  scene.add(ambientLight);

  // Add hemisphere light for more natural lighting
  const hemisphereLight = new THREE.HemisphereLight(0xff8a96, 0x444444, 0.6);
  hemisphereLight.position.set(0, 20, 0);
  scene.add(hemisphereLight);

  // 7. JSON Scene Loading
  const objectLoader = new THREE.ObjectLoader();
  let mixer; // For animations if present

  async function loadJSONScene() {
    try {
      // Replace 'path/to/your/scene.json' with your actual JSON file path
      const response = await fetch('https://perception-pod.netlify.app/project.json');
      const jsonData = await response.json();
      
      // Parse the JSON data
      const loadedObject = objectLoader.parse(jsonData);
      
      // Process all meshes in the loaded object
      loadedObject.traverse((child) => {
        if (child.isMesh) {
          // Disable shadow casting and receiving
          child.castShadow = false;
          child.receiveShadow = false;
          
          if (child.material) {
            // Enhanced material properties for realism
            if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
              // Enhance surface properties
              child.material.roughness = child.material.roughness || 0.4;
              child.material.metalness = child.material.metalness || 0.0;
              child.material.envMapIntensity = 1.5;
              
              // Improve normal mapping
              if (child.material.normalMap) {
                child.material.normalScale.set(1.5, 1.5);
              }
            }
            
            // Handle transparency with improved settings
            if (child.material.transparent || child.material.opacity < 1) {
              child.material.transparent = true;
              child.material.depthWrite = false;
              child.material.side = THREE.DoubleSide;
              child.material.alphaTest = 0.01;
            }
            
            child.material.needsUpdate = true;
          }
        }
      });
      
      // Handle animations if present
      if (loadedObject.animations && loadedObject.animations.length > 0) {
        mixer = new THREE.AnimationMixer(loadedObject);
        loadedObject.animations.forEach(clip => {
          mixer.clipAction(clip).play();
        });
      }
      
      // Calculate bounding box and center the object
      const box = new THREE.Box3().setFromObject(loadedObject);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      loadedObject.position.sub(center);
      
      // Scale the object to fit desired size
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 6;
      const scale = desiredSize / maxDim;
      loadedObject.scale.set(scale, scale, scale);
      
      // Update controls target
      controls.target.set(0, 0, 0);
      controls.update();

      // Add the loaded object to the scene
      scene.add(loadedObject);
      
    } catch (error) {
      console.error('JSON scene loading error:', error);
    }
  }

  // Load the JSON scene
  loadJSONScene();

  // 8. Render Loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update animation mixer if present
    if (mixer) {
      mixer.update(deltaTime);
    }
    
    controls.update();
    composer.render(); // Use composer instead of renderer
  }
  animate();

  // 9. Handle Window Resizing
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
  });
}

export default setupModelViewer;