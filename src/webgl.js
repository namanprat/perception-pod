import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

function brev()
{
const container = document.getElementById('model');

// Create the scene
const scene = new THREE.Scene();

// Create the camera
const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
// Position the camera a bit further back to see the model better
camera.position.z = 22;

// --- MOUSE PARALLAX SETUP ---
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;
}

container.addEventListener('mousemove', onMouseMove);
// --- END OF PARALLAX SETUP ---

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

container.appendChild(renderer.domElement);

const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://perception-pod.netlify.app/enviornment.hdr',
    (texture) => {
        texture.flipY = false;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;

        texture.dispose();
        pmremGenerator.dispose();
    },
    undefined,
    (error) => {
        console.error("An error occurred loading the HDR environment map.", error);
    }
);

// --- HELPER FUNCTION TO LIST CHILDREN GROUPS ---
function listChildrenGroups(object, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${object.name || 'Unnamed'} (${object.type})`);
    
    // Log additional useful information
    if (object.type === 'Mesh') {
        console.log(`${indent}  - Geometry: ${object.geometry.type}`);
        console.log(`${indent}  - Material: ${object.material.type}`);
        if (object.material.name) {
            console.log(`${indent}  - Material Name: ${object.material.name}`);
        }
    }
    
    // Recursively list children
    object.children.forEach(child => {
        listChildrenGroups(child, depth + 1);
    });
}

// --- FUNCTION TO GET FLAT LIST OF ALL OBJECTS ---
function getFlatObjectList(object, list = []) {
    list.push({
        name: object.name || 'Unnamed',
        type: object.type,
        uuid: object.uuid,
        object: object
    });
    
    object.children.forEach(child => {
        getFlatObjectList(child, list);
    });
    
    return list;
}

let model;

const loader = new GLTFLoader();
loader.load(
    'https://perception-pod.netlify.app/test.glb',
    (gltf) => {
        model = gltf.scene;
        console.log("Model loaded successfully.");

        // --- LIST ALL CHILDREN GROUPS ---
        console.log("=== MODEL STRUCTURE ===");
        listChildrenGroups(model);
        
        console.log("\n=== FLAT OBJECT LIST ===");
        const objectList = getFlatObjectList(model);
        objectList.forEach((obj, index) => {
            console.log(`${index}: ${obj.name} (${obj.type})`);
        });
        
        console.log("\n=== GROUPS ONLY ===");
        const groups = objectList.filter(obj => obj.type === 'Group');
        groups.forEach((group, index) => {
            console.log(`Group ${index}: ${group.name}`);
        });
        
        console.log("\n=== MESHES ONLY ===");
        const meshes = objectList.filter(obj => obj.type === 'Mesh');
        meshes.forEach((mesh, index) => {
            console.log(`Mesh ${index}: ${mesh.name}`);
        });

        // --- FIND SPECIFIC MESHES FOR EXPLODED VIEW ---
        let crustMesh = null;
        let outerCoreMesh = null;
        let mantleMesh = null;

        model.traverse((child) => {
            if (child.type === 'Mesh') {
                switch(child.name) {
                    case 'Crust':
                        crustMesh = child;
                        break;
                    case 'OuterCore':
                        outerCoreMesh = child;
                        break;
                    case 'Mantle':
                        mantleMesh = child;
                        break;
                }
            }
        });

        console.log("\n=== FOUND MESHES FOR EXPLOSION ===");
        console.log("Crust:", crustMesh ? "Found" : "Not found");
        console.log("OuterCore:", outerCoreMesh ? "Found" : "Not found");
        console.log("Mantle:", mantleMesh ? "Found" : "Not found");

        // Calculate bounding box for centering
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredSize = 5;
        const finalScale = (desiredSize / maxDim) * 1.6; // 20% bigger final size

        // --- POSITIONING CALCULATIONS ---
        const modelCenter = {
            x: -center.x,
            y: -center.y,
            z: -center.z
        };

        // Focus on crust (top) - position to show the top part prominently
        // Calculate crust mesh position if available for better positioning
        let crustPosition = { x: 0, y: 0, z: 0 };
        if (crustMesh) {
            const crustBox = new THREE.Box3().setFromObject(crustMesh);
            const crustCenter = crustBox.getCenter(new THREE.Vector3());
            crustPosition = { x: crustCenter.x, y: crustCenter.y, z: crustCenter.z };
        }
        
        const crustFocus = {
            x: -crustPosition.x, // Center the crust horizontally
            y: -crustPosition.y, // Center the crust vertically to face camera
            z: modelCenter.z
        };

        // --- EXPLOSION SPACING CALCULATIONS ---
        const explosionSpacing = Math.max(size.x, size.y, size.z) * 0.8;
        
        // Store original positions of meshes for explosion animation
        const originalPositions = {};
        if (crustMesh) originalPositions.crust = crustMesh.position.clone();
        if (outerCoreMesh) originalPositions.outerCore = outerCoreMesh.position.clone();
        if (mantleMesh) originalPositions.mantle = mantleMesh.position.clone();

        // Define explosion offsets
        const explosionOffsets = {
            crust: { x: 0, y: explosionSpacing * 0.8, z: 0 }, // Crust moves up
            mantle: { x: 0, y: 0, z: 0 }, // Mantle stays in center
            outerCore: { x: 0, y: -explosionSpacing * 0.8, z: 0 } // Core moves down
        };

        // --- INITIAL STATE: Show crust focused, tilted away from screen ---
        model.scale.set(0.1, 0.1, 0.1);
        model.position.set(crustFocus.x, crustFocus.y, crustFocus.z);
        
        // Tilt the model away from the screen (rotate around X-axis)
        model.rotation.x = Math.PI * 0.15; // Tilt 27 degrees away from viewer

        scene.add(model);
        console.log("Model added to scene, starting animation.");

        // --- ENTRANCE ANIMATION ---
        const entranceTl = gsap.timeline({ defaults: { duration: 3, ease: "power4.inOut" }});

        // Calculate scales - zoom in to show crust clearly (increased by 20%)
        const crustScale = finalScale * 3.0; // Increased from 2.5 to 3.0 (20% bigger)
        
        entranceTl.to(model.scale, {
            delay: 1,
            x: crustScale,
            y: crustScale,
            z: crustScale,
        }, 0);
        
        // --- SCROLL-TRIGGERED ANIMATION ---
        ScrollTrigger.create({
            trigger: container.parentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
                if (model) {
                    const progress = self.progress;
                    
                    // Split animation: 50% for centering & rotation, 50% for explosion
                    const centerPhase = 0.5;
                    const explosionPhase = 0.5;
                    
                    if (progress <= centerPhase) {
                        // PHASE 1: Move to center and complete 90deg rotation (0% - 50%)
                        const phaseProgress = progress / centerPhase;
                        
                        // Rotation: maintain tilt, add Y rotation to complete 90 degrees
                        model.rotation.x = Math.PI * 0.15; // Keep tilt away from viewer
                        model.rotation.y = phaseProgress * Math.PI * 0.5; // Complete 90 degree Y rotation
                        
                        // Zoom out: interpolate from crust scale to final scale
                        const currentScale = crustScale + (finalScale - crustScale) * phaseProgress;
                        model.scale.set(currentScale, currentScale, currentScale);
                        
                        // Move from crust focus to absolute center (0, 0, 0)
                        const currentX = crustFocus.x + (0 - crustFocus.x) * phaseProgress; // Move to x = 0
                        const currentY = crustFocus.y + (0 - crustFocus.y) * phaseProgress; // Move to y = 0
                        const currentZ = crustFocus.z + (0 - crustFocus.z) * phaseProgress; // Move to z = 0
                        
                        model.position.set(currentX, currentY, currentZ);
                        
                        // Keep mesh positions at original during centering phase
                        if (crustMesh) crustMesh.position.copy(originalPositions.crust);
                        if (mantleMesh) mantleMesh.position.copy(originalPositions.mantle);
                        if (outerCoreMesh) outerCoreMesh.position.copy(originalPositions.outerCore);
                        
                    } else {
                        // PHASE 2: Exploded view AFTER 90deg rotation is complete (50% - 100%)
                        const phaseProgress = (progress - centerPhase) / explosionPhase;
                        
                        // Rotation: 90deg Y rotation is complete, gradually reduce tilt
                        const tiltReduction = phaseProgress * 0.5; // Reduce tilt by half during explosion
                        model.rotation.x = Math.PI * 0.15 * (1 - tiltReduction);
                        model.rotation.y = Math.PI * 0.5; // Keep at 90 degrees, no additional rotation
                        
                        // Keep scale at final scale
                        model.scale.set(finalScale, finalScale, finalScale);
                        
                        // Keep model at absolute center (0, 0, 0)
                        model.position.set(0, 0, 0);
                        
                        // Animate mesh explosions with easing - ONLY happens after rotation
                        const easeProgress = 1 - Math.pow(1 - phaseProgress, 3); // Ease-out cubic
                        
                        if (crustMesh) {
                            // Crust - move up
                            crustMesh.position.x = originalPositions.crust.x + (explosionOffsets.crust.x * easeProgress);
                            crustMesh.position.y = originalPositions.crust.y + (explosionOffsets.crust.y * easeProgress);
                            crustMesh.position.z = originalPositions.crust.z + (explosionOffsets.crust.z * easeProgress);
                        }
                        
                        if (mantleMesh) {
                            // Mantle - stay centered
                            mantleMesh.position.x = originalPositions.mantle.x + (explosionOffsets.mantle.x * easeProgress);
                            mantleMesh.position.y = originalPositions.mantle.y + (explosionOffsets.mantle.y * easeProgress);
                            mantleMesh.position.z = originalPositions.mantle.z + (explosionOffsets.mantle.z * easeProgress);
                        }
                        
                        if (outerCoreMesh) {
                            // Core - move down
                            outerCoreMesh.position.x = originalPositions.outerCore.x + (explosionOffsets.outerCore.x * easeProgress);
                            outerCoreMesh.position.y = originalPositions.outerCore.y + (explosionOffsets.outerCore.y * easeProgress);
                            outerCoreMesh.position.z = originalPositions.outerCore.z + (explosionOffsets.outerCore.z * easeProgress);
                        }
                    }
                }
            }
        });

    },
    undefined,
    (error) => {
        console.error('An error happened during loading:', error);
    }
);

function animate() {
    requestAnimationFrame(animate);

    // --- PARALLAX EFFECT (CONTINUES THROUGHOUT) ---
    if (camera) {
        const parallaxIntensity = 1;
        const targetX = mouse.x * parallaxIntensity;
        const easing = 0.05;
        camera.position.x += (targetX - camera.position.x) * easing;
        camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
}
animate();

// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    ScrollTrigger.refresh(); // Refresh ScrollTrigger on resize
});
}
export default brev