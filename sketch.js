// sketch.js - Improved lensing calculation and galaxy colors

let galaxies = []; // Renamed back from stars
const numGalaxies = 1500; // Adjusted for potentially better performance/clarity
let massiveObject;
let zoom = 0.8; // Adjusted initial zoom
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = Math.PI / 12; // Slightly less initial tilt
let rotY = 0;
let canvas;

// --- Lensing Parameters (Tune these!) ---
// Using parameters known to create arcs/stretching
let einsteinRadiusSq = 18000; // Controls the 'size' of the lensing effect area (squared)
let deflectionStrength = einsteinRadiusSq * 1.5; // Strength of deflection (Adjust for more/less stretching)
// -----------------------------------------


function setup() {
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvas-container');
  console.log("Setup: Improved Lensing & Colors. Canvas:", width, height);

  // Define massive object (Lens) - Kept as blue sphere
  massiveObject = {
    x: 0,
    y: 0,
    z: -100, // Bring lens slightly closer? Adjust as needed.
  };
  console.log("Massive object defined at z =", massiveObject.z);

  // Create background galaxies with COLOR and size variation
  let spread = max(width, height) * 3; // Adjust spread
  let depth = spread * 2.5; // Increase depth range
  galaxies = [];
  console.log("Creating galaxies...");
  for (let i = 0; i < numGalaxies; i++) {
    // --- Galaxy Color ---
    let r = random(180, 255); let g = random(180, 255); let b = random(180, 255);
    let randColor = random();
    if (randColor < 0.35) { b = 255; g = random(180, 230); r = random(180, 230); } // Bluish (more common)
    else if (randColor < 0.6) { b = random(150, 200); g = random(200, 255); r = 255; } // Yellowish/Orangish
    // Remaining are whitish

    // --- Galaxy Size ---
    let baseSize = random(1.5, 4.5);
     // Place galaxies further back relative to lens Z
    let galaxyZ = random(-depth, -depth * 0.4) + massiveObject.z; // Ensure they are behind lens Z
    let distanceFactor = map(galaxyZ, -depth + massiveObject.z, -depth * 0.4 + massiveObject.z, 0.6, 1.1);
    let galaxySize = baseSize * distanceFactor;

    galaxies.push({
      x: random(-spread, spread),
      y: random(-spread, spread),
      z: galaxyZ,
      size: galaxySize,
      color: color(r, g, b) // Store p5.Color object
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

  // Apply view transformations
  let camZ = (height/2.0) / tan(PI*30.0/180.0);
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0);

  rotateX(rotX); rotateY(rotY); scale(zoom);
  // Center view near the massive object's plane for easier observation
  translate(-massiveObject.x, -massiveObject.y, -massiveObject.z);


  // --- Draw Massive Object (Lens) ---
  push();
  // No need to translate again if view is already centered
  // translate(massiveObject.x, massiveObject.y, massiveObject.z);
  translate(0, 0, 0); // Positioned at the origin of the translated view
  noStroke();
  fill(100, 150, 255); // Blue sphere
  sphere(25); // Slightly smaller?
  pop();


  // --- Draw Galaxies with Improved Lensing ---
  if (galaxies && galaxies.length > 0) {
      for (let gal of galaxies) {
          // Calculate distortion based on projected XY position relative to lens center (0,0 in this view)
          // Pass the galaxy's world position and the lens's world position
          let distortedPos = calculateDistortion(gal.x, gal.y, massiveObject.x, massiveObject.y);

          push();
          // Draw galaxy at its original Z depth but distorted XY world position
          // Note: We already translated the view, so distortedPos world coords work here
          translate(distortedPos.x, distortedPos.y, gal.z);
          fill(gal.color); // Use assigned galaxy color
          noStroke();
          sphere(gal.size);
          pop();
      }
  } else {
       if(frameCount < 2) console.warn("Galaxies array is missing or empty in draw loop!");
  }

  // REMOVED call to drawLensingEffect();

} // End draw()


// calculateDistortion function (Using 1/r^2 version for better arcs/stretching)
function calculateDistortion(starX, starY, lensX, lensY) {
  // Calculate vector from lens center to star's projected position (in XY plane)
  let dx = starX - lensX;
  let dy = starY - lensY;

  // Squared distance from lens center in the XY plane
  let rSq = dx*dx + dy*dy;

   let minRSq = 25.0; // Minimum distance squared - adjust if needed
   if (rSq < minRSq) {
     rSq = minRSq;
   }

  // Gravitational Lensing Approximation: Stronger effect closer to center
  // theta_vec approx = beta_vec * (1 + Deflection_Strength / rSq)
  let factor = 1 + deflectionStrength / rSq;

  // Calculate distorted WORLD coordinates
  let distortedX = lensX + dx * factor;
  let distortedY = lensY + dy * factor;

  return createVector(distortedX, distortedY); // Return vector with distorted X, Y
}


// REMOVED drawLensingEffect function


// --- Mouse Interaction Functions ---
function mouseDragged() {
  if (isDragging) {
    let deltaX = mouseX - lastMouseX; let deltaY = mouseY - lastMouseY;
    // Using simpler rotation mapping
    rotY += deltaX * 0.005; rotX -= deltaY * 0.005;
    rotX = constrain(rotX, -PI/2 * 0.95, PI/2 * 0.95);
    lastMouseX = mouseX; lastMouseY = mouseY;
  }
}

function mousePressed() {
  // Simplified interaction - starts drag anywhere outside overlay (potentially)
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  isDragging = true;
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
   // Simplified zoom
   zoom -= event.delta * 0.001 * zoom;
   zoom = constrain(zoom, 0.02, 30); // Adjusted zoom limits
   return false; // Prevent page scrolling
}

console.log("sketch.js with improved lensing and colors loaded.");
