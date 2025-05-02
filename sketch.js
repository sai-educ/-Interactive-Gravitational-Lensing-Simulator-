// sketch.js - Added Galaxy Types and Placeholder Visuals

let galaxies = [];
const numGalaxies = 2000; // Adjusted number
let massiveObject;
let zoom = 0.8;
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = Math.PI / 12;
let rotY = 0;
let canvas;

// --- Galaxy Types (from provided 2D code) ---
const GALAXY_TYPES = ['elliptical', 'spiral', 'barred_spiral', 'ringed_spiral', 'irregular', 'lenticular', 'edge_on_spiral'];

// --- Lensing Parameters ---
let einsteinRadiusSq = 18000;
let deflectionStrength = einsteinRadiusSq * 1.5;

// --- Galaxy Distribution Parameters ---
const minGalaxyDist = 2000;
const maxGalaxyDist = 4000;

// --- Preload Function (Example for loading textures later) ---
/*
let galaxyTextures = {};
function preload() {
  // Example: Load textures for each type here
  // galaxyTextures['spiral'] = loadImage('textures/spiral.png');
  // galaxyTextures['elliptical'] = loadImage('textures/elliptical.png');
  // ... etc for all types in GALAXY_TYPES
  console.log("preload() finished - Textures would be loaded here.");
}
*/


function setup() {
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvas-container');
  console.log("Setup: Added Galaxy Types. Canvas:", width, height);

  massiveObject = { x: 0, y: 0, z: 0 }; // Lens at origin
  console.log("Massive object defined at origin");

  // Create background galaxies with TYPE, COLOR and size variation
  galaxies = [];
  console.log(`Creating ${numGalaxies} galaxies between ${minGalaxyDist} and ${maxGalaxyDist} distance...`);
  for (let i = 0; i < numGalaxies; i++) {
    // Spherical Position
    let r = lerp(minGalaxyDist, maxGalaxyDist, pow(random(), 1/3));
    let theta = random(TWO_PI);
    let phi = acos(random(-1, 1));
    let x = r * sin(phi) * cos(theta);
    let y = r * sin(phi) * sin(theta);
    let z = r * cos(phi);

    // --- Assign Galaxy Type ---
    let type = GALAXY_TYPES[Math.floor(Math.random() * GALAXY_TYPES.length)];

    // --- Placeholder Color based on Type ---
    // (You would replace this if using textures)
    let baseColor;
    let aspect = 1.0; // Aspect ratio for scaling sphere
    switch (type) {
        case 'elliptical':
        case 'lenticular':
            baseColor = color(255, 240, 200); // Yellowish/White
            aspect = random(0.5, 0.9); // More elliptical
            break;
        case 'spiral':
        case 'barred_spiral':
        case 'ringed_spiral':
            baseColor = color(200, 220, 255); // Bluish/White arms/disk
             break;
        case 'irregular':
             baseColor = color(180, 180, 255); // More blue/patchy
             break;
        case 'edge_on_spiral':
             baseColor = color(240, 210, 190); // Dusty reddish/yellow core hint
             aspect = random(0.1, 0.3); // Very flat
             break;
        default:
             baseColor = color(220, 220, 220);
    }

    // --- Galaxy Size ---
    let baseSize = random(2.0, 5.5); // Adjusted size range
    let sizeFactor = map(r, minGalaxyDist, maxGalaxyDist, 1.1, 0.8);
    let galaxySize = baseSize * sizeFactor;

    galaxies.push({
      x: x, y: y, z: z,
      type: type, // Store the type
      size: galaxySize,
      color: baseColor, // Store the representative color
      aspect: aspect // Store aspect for potential scaling
    });
  }
  console.log(galaxies.length + " galaxies created.");
  console.log("Setup complete.");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  // --- Camera and View Setup ---
  let fov = PI / 3; let aspect = width / height;
  let nearClip = 0.1; let farClip = maxGalaxyDist * 1.5;
  perspective(fov, aspect, nearClip, farClip);
  let camDist = (height / 2.0) / tan(fov / 2.0) * 1.2;
  camera(0, 0, camDist, 0, 0, 0, 0, 1, 0);
  rotateX(rotX); rotateY(rotY); scale(zoom);

  // --- Draw Massive Object (Lens - Blue Dot) ---
  push();
  noStroke(); fill(100, 150, 255); sphere(25);
  pop();

  // --- Draw Galaxies with Lensing ---
  if (galaxies && galaxies.length > 0) {
      for (let gal of galaxies) {
          let distortedPos = calculateDistortion(gal.x, gal.y, 0, 0);

          push();
          translate(distortedPos.x, distortedPos.y, gal.z);

          // ---=== Placeholder: Draw sphere based on type ===---
          // This is where you would replace the sphere with a
          // textured plane facing the camera (billboard)

          /* --- Example Texture/Sprite Logic (Conceptual) ---
          let tex = galaxyTextures[gal.type] || defaultTexture; // Get preloaded texture
          let planeWidth = gal.size * 2; // Adjust sizing as needed
          let planeHeight = gal.size * 2;

          // Billboard rotation (make plane face camera) - Requires more complex math/p5 methods
           // Simplified: Assume view is mostly forward, just draw plane
          // More complex: Calculate angle to camera and rotate

          texture(tex);
          plane(planeWidth, planeHeight);
          */

          // --- Current Placeholder Implementation ---
          fill(gal.color); // Use color based on type
          noStroke();
          push(); // Apply scaling locally
          // Apply aspect ratio scaling for certain types
          if (gal.type === 'elliptical' || gal.type === 'lenticular' || gal.type === 'edge_on_spiral') {
             scale(1, gal.aspect, 1); // Scale sphere vertically
          }
          sphere(gal.size);
          pop(); // Restore scale
          // --- End Placeholder ---

          pop();
      }
  }

} // End draw()


// --- Lensing Calculation (Produces stretching/arcs) ---
function calculateDistortion(starX, starY, lensX, lensY) {
  let dx = starX - lensX; let dy = starY - lensY;
  let rSq = dx*dx + dy*dy;
  let minRSq = 25.0;
  if (rSq < minRSq) { rSq = minRSq; }
  let factor = 1 + deflectionStrength / rSq;
  let distortedX = lensX + dx * factor;
  let distortedY = lensY + dy * factor;
  return createVector(distortedX, distortedY);
}


// --- Mouse Interaction Functions ---
function mouseDragged() {
  if (isDragging) {
    let deltaX = mouseX - lastMouseX; let deltaY = mouseY - lastMouseY;
    rotY += deltaX * 0.005; rotX -= deltaY * 0.005;
    rotX = constrain(rotX, -PI, PI);
    lastMouseX = mouseX; lastMouseY = mouseY;
  }
}

function mousePressed() {
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  isDragging = true;
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
   zoom -= event.delta * 0.001 * zoom;
   zoom = constrain(zoom, 0.01, 50);
   return false; // Prevent page scrolling
}

console.log("sketch.js with galaxy types loaded.");
