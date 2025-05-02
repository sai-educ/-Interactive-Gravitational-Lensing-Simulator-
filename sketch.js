let galaxies = [];
const numGalaxies = 3500;
let massiveObject;
let zoom = 0.6;
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = Math.PI / 6;
let rotY = 0;
let canvas;

// --- Lensing Parameters (Tune these!) ---
let einsteinRadiusSq = 15000;
// Slightly increased strength for more visible distortion
let deflectionStrength = einsteinRadiusSq * 1.4; // Adjusted from 1.2
// -----------------------------------------


function setup() {
  console.log("p5 setup() started");
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  console.log("Canvas created:", width, height);
  canvas.parent('canvas-container');
  console.log("Canvas parented");

  massiveObject = { x: 0, y: 0, z: 0 };
  console.log("Massive object defined");

  let spread = max(width, height) * 4;
  let depth = spread * 2;
  galaxies = [];
  console.log("Creating galaxies...");
  for (let i = 0; i < numGalaxies; i++) {
    let r = random(180, 255); let g = random(180, 255); let b = random(180, 255);
    let randColor = random();
    if (randColor < 0.3) { b = 255; g = random(180, 230); r = random(180, 230); } // Bluish
    else if (randColor < 0.6) { b = random(150, 200); g = random(200, 255); r = 255; } // Yellowish
    let baseSize = random(1.5, 4.5);
    let distanceFactor = map(random(-depth, -depth * 0.5), -depth, -depth*0.5, 0.7, 1.2);
    let galaxySize = baseSize * distanceFactor;
    galaxies.push({
      x: random(-spread, spread), y: random(-spread, spread), z: random(-depth, -depth * 0.5),
      size: galaxySize, color: color(r, g, b)
    });
  }
  console.log(galaxies.length + " galaxies created.");
  console.log("p5 setup() finished");
}

function windowResized() {
  console.log("Window resized");
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  if (frameCount < 2) { console.log("p5 draw() started"); }
  background(0);

  let camZ = (height/2.0) / tan(PI*30.0/180.0);
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0);

  rotateX(rotX); rotateY(rotY); scale(zoom);
  translate(-massiveObject.x, -massiveObject.y, -massiveObject.z);

  // --- Draw Lens Glow Effect FIRST ---
  drawLensGlow(); // Will now draw blue glow

  // --- Draw Galaxies with Lensing ---
  if (!galaxies || galaxies.length === 0) {
      if(frameCount < 2) console.warn("Galaxies array is missing or empty in draw loop!");
  } else {
      for (let gal of galaxies) {
          let distortedPos = calculateDistortion(gal.x, gal.y, massiveObject.x, massiveObject.y);
          push();
          translate(distortedPos.x, distortedPos.y, gal.z);
          fill(gal.color);
          noStroke();
          sphere(gal.size);
          pop();
      }
  }
} // End draw()


function drawLensGlow() { // MODIFIED FOR BLUE GLOW
  push();
  translate(massiveObject.x, massiveObject.y, massiveObject.z);
  let baseRadius = 25;
  let maxGlowRadius = baseRadius * 12;
  let steps = 15;
  noStroke();
  for (let i = steps; i >= 0; i--) {
    let t = i / steps;
    let currentRadius = lerp(baseRadius * 0.5, maxGlowRadius, pow(1.0 - t, 0.5));
    let currentAlpha = lerp(0, 80, pow(t, 2)); // Adjusted max alpha slightly

    // Interpolate color - From light blue/white core to medium/darker blue outer glow
    let coreColor = color(200, 220, 255, currentAlpha); // Light blue/white core
    let outerColor = color(100, 150, 255, currentAlpha); // Medium blue outer glow
    let currentColor = lerpColor(outerColor, coreColor, pow(t, 1.5)); // Bias towards core

    fill(currentColor);
    ellipse(0, 0, currentRadius * 2, currentRadius * 2, 24);
  }
  pop();
}


function calculateDistortion(starX, starY, lensX, lensY) {
  let dx = starX - lensX; let dy = starY - lensY;
  let rSq = dx*dx + dy*dy;
  let minRSq = 10.0;
  if (rSq < minRSq) { rSq = minRSq; }
  let factor = 1 + deflectionStrength / rSq; // deflectionStrength was adjusted globally
  let distortedX = lensX + dx * factor;
  let distortedY = lensY + dy * factor;
  return createVector(distortedX, distortedY);
}


// --- Mouse Interaction Functions ---
// MODIFIED: Removed select() checks to avoid p5.dom dependency/errors
function mouseDragged() {
  if (isDragging) {
    let deltaX = mouseX - lastMouseX; let deltaY = mouseY - lastMouseY;
    rotY += deltaX * 0.005; rotX -= deltaY * 0.005;
    rotX = constrain(rotX, -PI/2 * 0.95, PI/2 * 0.95);
    lastMouseX = mouseX; lastMouseY = mouseY;
  }
}

function mousePressed() {
  // Simplified: always allow dragging to start anywhere on canvas
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  isDragging = true;
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
   // Simplified: always zoom canvas, ignore info box overlap
   zoom -= event.delta * 0.001 * zoom;
   zoom = constrain(zoom, 0.02, 30);
   return false; // Prevent page scrolling
}

// Final check log (can be removed if desired)
console.log("sketch.js script loaded and parsed");
