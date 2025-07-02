#define filmGrainIntensity 0.1

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