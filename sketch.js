// sketch.js - Using the user-provided specific version

let stars = [];
const numStars = 1000; // Using value from provided code
let massiveObject;
let zoom = 1;
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = 0;
let rotY = 0;
let canvas; // Added for parenting

function setup() {
  // Modified for fullscreen and parenting
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvas-container');

  console.log("Using original setup logic. Canvas:", width, height);

  // Create background stars (from provided code)
  let starSpread = max(width, height) * 1.5; // Adjust spread based on canvas size
  let starDepth = 1000; // Use depth from original code range
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(-starSpread, starSpread), // Use adjusted spread
      y: random(-starSpread, starSpread), // Use adjusted spread
      z: random(-starDepth, -starDepth / 2), // Use original Z range idea
      size: random(1, 3)
    });
  }
  console.log(stars.length + " stars created.");

  // Create massive object (from provided code)
  massiveObject = {
    x: 0,
    y: 0,
    z: -200, // Using original Z
    mass: 500 // Using original mass
  };
  console.log("Massive object created.");
  console.log("Setup complete.");
}

// Added for responsive fullscreen
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  if (frameCount < 2) { console.log("Draw loop started."); } // Add brief log

  background(0);

  // Apply rotations and zoom (from provided code)
  rotateX(rotX);
  rotateY(rotY);
  scale(zoom);

  // Draw massive object (from provided code)
  push();
  translate(massiveObject.x, massiveObject.y, massiveObject.z);
  noStroke();
  fill(100, 100, 255); // Original blue color
  sphere(30); // Original size
  pop();

  // Draw stars with gravitational lensing effect (from provided code)
  for (let star of stars) {
    let distortedPosition = calculateDistortion(star);

    push();
    // Using original Z, distorted XY
    translate(distortedPosition.x, distortedPosition.y, star.z);
    fill(255); // Original white color
    noStroke();
    sphere(star.size);
    pop();
  }

  // Draw lensing effect (from provided code)
  drawLensingEffect();

} // End draw()


// calculateDistortion function (exactly as provided by user)
function calculateDistortion(star) {
  let dx = star.x - massiveObject.x;
  let dy = star.y - massiveObject.y;
  let dz = star.z - massiveObject.z; // Original includes Z in distance calc
  let distance = sqrt(dx*dx + dy*dy + dz*dz); // Original uses 3D distance

  // Prevent division by zero if distance is extremely small
  if (distance < 0.1) {
      distance = 0.1;
  }

  let angle = atan2(dy, dx); // Angle in XY plane
  let distortionFactor = massiveObject.mass / distance; // Original factor calc

  // Apply distortion based on original logic
  let distortedX = star.x + distortionFactor * cos(angle);
  let distortedY = star.y + distortionFactor * sin(angle);

  // Original returned only X, Y implicitly in a vector
  return createVector(distortedX, distortedY);
}

// drawLensingEffect function (exactly as provided by user)
function drawLensingEffect() {
  push();
  noFill();
  stroke(100, 100, 255, 50); // Original faint blue lines
  strokeWeight(2);

  // Adjust loop step for potentially better performance if needed
  for (let angle = 0; angle < TWO_PI; angle += 0.1) {
    // Radius calculation based on original code
    let radius = massiveObject.mass * 0.5;
    // Use massiveObject position directly (original logic)
    let x = massiveObject.x + radius * cos(angle);
    let y = massiveObject.y + radius * sin(angle);
    let z = massiveObject.z;

    beginShape();
    // Loop creates the radiating line effect
    for (let t = 0; t <= 1; t += 0.1) {
      let lensedX = lerp(x, x * 1.5, t);
      let lensedY = lerp(y, y * 1.5, t);
      let lensedZ = lerp(z, z - 100, t);
      vertex(lensedX, lensedY, lensedZ);
    }
    endShape();
  }

  pop();
}

// mouseDragged function (exactly as provided by user)
function mouseDragged() {
  if (isDragging) {
    let deltaX = mouseX - lastMouseX;
    let deltaY = mouseY - lastMouseY;
    // Using map function for rotation sensitivity based on original code
    rotY += map(deltaX, 0, width, 0, TWO_PI) * 0.5;
    rotX += map(deltaY, 0, height, 0, TWO_PI) * 0.5;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

// mousePressed function (exactly as provided by user)
function mousePressed() {
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  isDragging = true;
}

// mouseReleased function (exactly as provided by user)
function mouseReleased() {
  isDragging = false;
}

// mouseWheel function (exactly as provided by user)
function mouseWheel(event) {
  // Original zoom logic
  zoom += event.delta * -0.001;
  zoom = constrain(zoom, 0.5, 5); // Original zoom limits
  return false; // Prevent page scrolling
}

console.log("Original sketch.js logic loaded (adapted for fullscreen).");
