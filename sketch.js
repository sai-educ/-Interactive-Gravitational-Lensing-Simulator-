// sketch.js - Spherical galaxy distribution

let galaxies = [];
const numGalaxies = 2500; // Adjusted number, tune as needed
let massiveObject;
let zoom = 0.8; // Start slightly more zoomed in
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = Math.PI / 12;
let rotY = 0;
let canvas;

// --- Lensing Parameters ---
let einsteinRadiusSq = 18000;
let deflectionStrength = einsteinRadiusSq * 1.5; // Slightly increased strength

// --- Galaxy Distribution Parameters ---
const minGalaxyDist = 2000; // Minimum distance from center
const maxGalaxyDist = 4000; // Maximum distance from center

// --- Dust Cloud Data ---
let dustClouds = [];

function setup() {
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvas-container');
  console.log("Setup: Spherical Galaxy Distribution. Canvas:", width, height);

  massiveObject = { x: 0, y: 0, z: 0 }; // Keep lens at origin
  console.log("Massive object defined at origin");

  // Create background galaxies in a SPHERICAL SHELL
  galaxies = [];
  console.log(`Creating ${numGalaxies} galaxies between ${minGalaxyDist} and ${maxGalaxyDist} distance...`);
  for (let i = 0; i < numGalaxies; i++) {
    // --- Spherical Position ---
    // Uniform volume distribution within the shell
    let r = lerp(minGalaxyDist, maxGalaxyDist, pow(random(), 1/3));
    let theta = random(TWO_PI); // Angle around Y axis (0 to 360)
    let phi = acos(random(-1, 1)); // Angle from Y axis (0 to 180)

    // Convert spherical to Cartesian coordinates
    let x = r * sin(phi) * cos(theta);
    let y = r * sin(phi) * sin(theta);
    let z = r * cos(phi);

    // --- Galaxy Color ---
    let colR = random(180, 255); let colG = random(180, 255); let colB = random(180, 255);
    let randColor = random();
    if (randColor < 0.35) { colB = 255; colG = random(180, 230); colR = random(180, 230); } // Bluish
    else if (randColor < 0.6) { colB = random(150, 200); colG = random(200, 255); colR = 255; } // Yellowish
    // Remaining are whitish

    // --- Galaxy Size ---
    let baseSize = random(1.5, 5.0); // Slightly larger max size
    // Optional: make slightly dimmer/smaller further away within the shell
    let sizeFactor = map(r, minGalaxyDist, maxGalaxyDist, 1.1, 0.8);
    let galaxySize = baseSize * sizeFactor;

    galaxies.push({
      x: x, y: y, z: z, // Use calculated spherical positions
      size: galaxySize,
      color: color(colR, colG, colB)
    });
  }
  console.log(galaxies.length + " galaxies created.");

  // --- Initialize Dust Clouds (Example Placeholder) ---
  dustClouds = [
    { x: -500, y: 200, z: -1000, baseColor: color(255, 100, 100, 100), size: 400, particles: 80 }, // Reddish
    { x: 600, y: -100, z: -1400, baseColor: color(100, 150, 255, 100), size: 500, particles: 100 } // Bluish
  ];
  console.log("Dust clouds initialized.");

  console.log("Setup complete.");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  // --- Camera and View Setup ---
  // Set perspective matrix (Field of View, Aspect Ratio, Near Clip, Far Clip)
  let fov = PI / 3; // 60 degrees field of view
  let aspect = width / height;
  let nearClip = 0.1;
  // Ensure far clip plane includes the most distant galaxies AND dust clouds
  let farClip = maxGalaxyDist * 1.5; // Make sure it's far enough
  perspective(fov, aspect, nearClip, farClip);

  // Set camera position and orientation
  // Pull camera back slightly further to see the spherical distribution better initially
  let camDist = (height / 2.0) / tan(fov / 2.0) * 1.2; // Adjusted distance
  camera(0, 0, camDist, 0, 0, 0, 0, 1, 0);

  // Apply user rotation and zoom
  rotateX(rotX); rotateY(rotY); scale(zoom);
  // No need to translate view since lens and galaxies are relative to origin (0,0,0)

  // --- Draw Dust Clouds (Placeholder - drawn behind galaxies) ---
  drawDustClouds();

  // --- Draw Massive Object (Lens) ---
  push();
  // Positioned at the origin
  noStroke();
  fill(100, 150, 255); // Blue sphere
  sphere(25);
  pop();


  // --- Draw Galaxies with Lensing ---
  if (galaxies && galaxies.length > 0) {
      for (let gal of galaxies) {
          // Calculate distortion based on projected XY position relative to lens (at origin)
          let distortedPos = calculateDistortion(gal.x, gal.y, 0, 0); // Lens is at 0,0

          push();
          // Draw galaxy at its original Z depth but distorted XY world position
          translate(distortedPos.x, distortedPos.y, gal.z);
          fill(gal.color);
          noStroke();
          sphere(gal.size);
          pop();
      }
  }

} // End draw()

// --- Dust Cloud Drawing Function (Placeholder) ---
function drawDustClouds() {
    for (let cloud of dustClouds) {
        push();
        // Go to cloud's base position
        translate(cloud.x, cloud.y, cloud.z);
        // Simple placeholder: draw overlapping transparent spheres
        noStroke();
        for (let i = 0; i < cloud.particles; i++) {
            let r = cloud.baseColor.levels[0] + random(-30, 30);
            let g = cloud.baseColor.levels[1] + random(-30, 30);
            let b = cloud.baseColor.levels[2] + random(-30, 30);
            let a = cloud.baseColor.levels[3] * random(0.1, 0.5); // Vary alpha
            let particleSize = cloud.size * random(0.05, 0.2);
            let particleX = random(-cloud.size / 2, cloud.size / 2);
            let particleY = random(-cloud.size / 2, cloud.size / 2);
            let particleZ = random(-cloud.size / 2, cloud.size / 2);
            fill(r, g, b, a);
            push();
            translate(particleX, particleY, particleZ);
            sphere(particleSize);
            pop();
        }
        pop();
    }
}


// --- Lensing Calculation ---
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
    rotX = constrain(rotX, -PI*1.0, PI*1.0); // Allow more rotation up/down
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
   zoom = constrain(zoom, 0.01, 50); // Even wider zoom
   return false;
}

console.log("sketch.js with spherical distribution loaded.");
