import * as THREE from 'three';

class Gradient {
    constructor() {
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.shaderMaterial = null;
        this.geometry = null;
        this.mesh = null;
        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this.mouseLerpFactor = 0.08;
        this.animationId = null;
        
        this.defaultColors = {
            color1: '#ffd2c7ff',     // amber yellow
            color2: '#bed0ffff',     // deep blue  
            color3: '#ffc4c4ff',     // pink
            color4: '#9dd8ffff',     // blue
            overlayColor1: '#f8dcb1ff', // overlay amber
            overlayColor2: '#ceb6ffff', // overlay purple
            overlayColor3: '#ffbad9ff', // overlay pink
            overlayColor4: '#cff0ffff'  // overlay cyan
        };

        // Inline shaders with film grain effect
        this.vertexShader = `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        this.fragmentShader = `
            #define filmGrainIntensity 0.0
            
            uniform float iTime;
            uniform vec2 iResolution;
            uniform vec2 iMouse;
            uniform vec2 iMouseSmooth;
            uniform float distortionSpeed;
            uniform float mouseIntensity;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform vec3 color3;
            uniform vec3 color4;
            uniform vec3 overlayColor1;
            uniform vec3 overlayColor2;
            uniform vec3 overlayColor3;
            uniform vec3 overlayColor4;
            
            mat2 Rot(float a) {
                float s = sin(a);
                float c = cos(a);
                return mat2(c, -s, s, c);
            }
            
            vec2 hash(vec2 p) {
                p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
                return fract(sin(p)*43758.5453);
            }
            
            float noise(in vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f*f*(3.0-2.0*f);
                float n = mix(mix(dot(-1.0+2.0*hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                dot(-1.0+2.0*hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                mix(dot(-1.0+2.0*hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                dot(-1.0+2.0*hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
                return 0.5 + 0.5*n;
            }
            
            float filmGrainNoise(in vec2 uv) {
                return length(hash(vec2(uv.x, uv.y)));
            }
            
            // Overlay blend mode function
            vec3 overlay(vec3 base, vec3 blend) {
                vec3 result;
                result.r = base.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r);
                result.g = base.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g);
                result.b = base.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b);
                return result;
            }
            
            // Generate displacement data without ripples
            vec4 generateDisplacementData(vec2 uv) {
                // Base displacement pattern only
                vec2 displacement = vec2(
                    sin(uv.x * 8.0 + iTime * 1.5) * 0.08,
                    cos(uv.y * 8.0 + iTime * 1.5) * 0.08
                );
                
                return vec4(0.0, 0.0, displacement.x, displacement.y);
            }
            
            void main() {
                vec2 fragCoord = gl_FragCoord.xy;
                vec2 uv = fragCoord / iResolution.xy;
                float aspectRatio = iResolution.x / iResolution.y;
                
                // Generate displacement data
                vec4 data = generateDisplacementData(uv);
                
                // Original gradient generation with displacement
                vec2 displacedUV = uv + 0.15 * data.zw;
                
                // Mouse influence with smoother falloff - reduced by 70%
                vec2 mouseUV = iMouseSmooth / iResolution.xy;
                float mouseInfluence = length(displacedUV - mouseUV) * 1.8;
                mouseInfluence = (1.0 - smoothstep(0.0, 1.0, mouseInfluence)) * mouseIntensity * 0.3;
                
                // Enhanced trailing effect - reduced by 70%
                vec2 trailMouseUV = mix(iMouse / iResolution.xy, mouseUV, 0.8);
                float trailInfluence = length(displacedUV - trailMouseUV) * 2.2;
                trailInfluence = (1.0 - smoothstep(0.0, 1.0, trailInfluence)) * 0.4 * mouseIntensity * 0.3;
                
                // Transformed uv with displacement
                vec2 tuv = displacedUV - 0.5;
                float degree = noise(vec2(iTime * 0.04 * distortionSpeed, tuv.x*tuv.y));
                tuv.y *= 1.0/aspectRatio;
                tuv *= Rot(radians((degree-0.5)*680.0+180.0));
                tuv.y *= aspectRatio;
                
                // Enhanced wave warp - reduced mouse interaction by 70%
                float frequency = 4.5 + mouseInfluence * 3.8;
                float amplitude = 32.0;
                float speed = iTime * 1.8 * distortionSpeed;
                float mouseWarpStrength = (mouseInfluence * 0.075) + trailInfluence * 0.3;
                
                tuv.x += sin(tuv.y*frequency+speed)/amplitude + sin(trailMouseUV.x * 12.0 + speed) * mouseWarpStrength;
                tuv.y += sin(tuv.x*frequency*1.4+speed)/(amplitude*0.6) + sin(trailMouseUV.y * 9.0 + speed) * mouseWarpStrength;
                
                // Use uniform colors instead of hardcoded ones
                vec3 amberYellow = color1;
                vec3 deepBlue = color2;
                vec3 pink = color3;
                vec3 blue = color4;
                
                // Create base gradient
                vec3 layer1 = mix(pink, deepBlue, smoothstep(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x));
                vec3 layer2 = mix(blue, amberYellow, smoothstep(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x));
                vec3 baseColor = mix(layer1, layer2, smoothstep(0.5, -0.3, tuv.y));
                
                // Create overlay layer with uniform colors
                vec3 overlayAmber = overlayColor1;
                vec3 overlayPurple = overlayColor2;
                vec3 overlayPink = overlayColor3;
                vec3 overlayCyan = overlayColor4;
                
                vec3 overlayLayer1 = mix(overlayPink, overlayPurple, smoothstep(-0.2, 0.3, (tuv*Rot(radians(10.0))).x));
                vec3 overlayLayer2 = mix(overlayCyan, overlayAmber, smoothstep(-0.2, 0.3, (tuv*Rot(radians(10.0))).x));
                vec3 overlayColor = mix(overlayLayer1, overlayLayer2, smoothstep(0.4, -0.4, tuv.y));
                
                // Apply overlay blend mode
                vec3 color = overlay(baseColor, overlayColor);
                
                // Mix with base color for subtle effect
                color = mix(baseColor, color, 0.6);
                
                // Apply film grain
                color = color - filmGrainNoise(uv) * filmGrainIntensity;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.init();
    }

    init() {
        // Get the target canvas element
        this.canvas = document.getElementById('gradient');
        if (!this.canvas) {
            return;
        }

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });

        // Set initial size based on canvas or window
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;

        this.renderer.setSize(width, height);

        // Create shader material with inline shaders
        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(width, height) },
                iMouse: { value: new THREE.Vector2(0, 0) },
                iMouseSmooth: { value: new THREE.Vector2(0, 0) },
                distortionSpeed: { value: 0.65 },
                mouseIntensity: { value: 1.0 },
                color1: { value: this.hexToVec3(this.defaultColors.color1) },
                color2: { value: this.hexToVec3(this.defaultColors.color2) },
                color3: { value: this.hexToVec3(this.defaultColors.color3) },
                color4: { value: this.hexToVec3(this.defaultColors.color4) },
                overlayColor1: { value: this.hexToVec3(this.defaultColors.overlayColor1) },
                overlayColor2: { value: this.hexToVec3(this.defaultColors.overlayColor2) },
                overlayColor3: { value: this.hexToVec3(this.defaultColors.overlayColor3) },
                overlayColor4: { value: this.hexToVec3(this.defaultColors.overlayColor4) }
            }
        });

        // Create a plane geometry that covers the screen
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
        this.scene.add(this.mesh);

        // Set up event listeners
        this.setupEventListeners();

        // Start animation
        this.animate();

        // Expose control functions globally
        window.setMouseIntensity = this.setMouseIntensity.bind(this);
        window.setDistortionSpeed = this.setDistortionSpeed.bind(this);
        window.setColors = this.setColors.bind(this);
    }

    // Helper function to convert CSS hex color to vec3
    hexToVec3(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return new THREE.Vector3(r, g, b);
    }

    setupEventListeners() {
        // Mouse tracking
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('resize', this.onWindowResize);
    }

    onMouseMove(event) {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = rect.height - (event.clientY - rect.top);
        } else {
            this.mouse.x = event.clientX;
            this.mouse.y = window.innerHeight - event.clientY;
        }
        this.shaderMaterial.uniforms.iMouse.value.copy(this.mouse);
    }

    // Control functions
    setMouseIntensity(intensity) {
        if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.mouseIntensity.value = intensity;
        }
    }

    setDistortionSpeed(speed) {
        if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.distortionSpeed.value = speed;
        }
    }

    // Color control functions
    setColors(colors) {
        if (!this.shaderMaterial) return;
        
        if (colors.color1) this.shaderMaterial.uniforms.color1.value = this.hexToVec3(colors.color1);
        if (colors.color2) this.shaderMaterial.uniforms.color2.value = this.hexToVec3(colors.color2);
        if (colors.color3) this.shaderMaterial.uniforms.color3.value = this.hexToVec3(colors.color3);
        if (colors.color4) this.shaderMaterial.uniforms.color4.value = this.hexToVec3(colors.color4);
        if (colors.overlayColor1) this.shaderMaterial.uniforms.overlayColor1.value = this.hexToVec3(colors.overlayColor1);
        if (colors.overlayColor2) this.shaderMaterial.uniforms.overlayColor2.value = this.hexToVec3(colors.overlayColor2);
        if (colors.overlayColor3) this.shaderMaterial.uniforms.overlayColor3.value = this.hexToVec3(colors.overlayColor3);
        if (colors.overlayColor4) this.shaderMaterial.uniforms.overlayColor4.value = this.hexToVec3(colors.overlayColor4);
    }

    // Handle window resize
    onWindowResize() {
        if (!this.canvas || !this.renderer || !this.shaderMaterial) return;
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.renderer.setSize(width, height);
        this.shaderMaterial.uniforms.iResolution.value.set(width, height);
    }

    // Animation loop
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.shaderMaterial && this.renderer && this.scene && this.camera) {
            this.shaderMaterial.uniforms.iTime.value = performance.now() * 0.001;
            this.mouseSmooth.lerp(this.mouse, this.mouseLerpFactor);
            this.shaderMaterial.uniforms.iMouseSmooth.value.copy(this.mouseSmooth);
            
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Cleanup method
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('resize', this.onWindowResize);
        
        if (this.geometry) this.geometry.dispose();
        if (this.shaderMaterial) this.shaderMaterial.dispose();
        if (this.renderer) this.renderer.dispose();
        
        // Remove global functions
        if (window.setMouseIntensity) delete window.setMouseIntensity;
        if (window.setDistortionSpeed) delete window.setDistortionSpeed;
        if (window.setColors) delete window.setColors;
    }
}

export default Gradient;