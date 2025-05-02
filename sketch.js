// sketch.js

let galaxies = []; // Renamed from 'stars'
const numGalaxies = 3500; // Adjusted count
let massiveObject;
let zoom = 0.6; // Adjusted initial zoom further
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = Math.PI / 6; // Initial tilt
let rotY = 0;
let canvas;

// --- Lensing Parameters (Tune these!) ---
let einsteinRadiusSq = 15000; // Controls the 'size' of the lensing effect area (squared)
let deflectionStrength = einsteinRadiusSq * 1.2; // Strength of deflection, related to Einstein Radius
// -----------------------------------------


function setup() {
  console.log("p5 setup() started"); // Debug log
  // Create canvas filling the window
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  console.log("Canvas created:", width, height); // Debug log
  canvas.parent('canvas-container'); // Attach to the container div
  console.log("Canvas parented"); // Debug log

  // Define massive object (acts as the lens)
  massiveObject = {
    x: 0,
    y: 0,
    z: 0,
  };
   console.log("Massive object defined"); // Debug log

  // Create background galaxies spread wider and deeper
  let spread = max(width, height) * 4; // Increased spread further
  let depth = spread * 2;
  galaxies = []; // Ensure galaxies array is clear before populating
  console.log("Creating galaxies..."); // Debug log
  for (let i = 0; i < numGalaxies; i++) {
    // --- Galaxy Color ---
    let r = random(180, 255);
    let g = random(180, 255);
    let b = random(180, 255);
    let randColor = random();
    if (randColor < 0.3) { b = 255; g = random(180, 230); r = random(180, 230); } // Bluish
    else if (randColor < 0.6) { b = random(150, 200); g = random(200, 255); r = 255; } // Yellowish/Orangish
    // Remaining are more whitish

    // --- Galaxy Size ---
    let baseSize = random(1.5, 4.5);
    let distanceFactor = map(random(-depth, -depth * 0.5), -depth, -depth*0.5, 0.7, 1.2); // Scale size slightly by depth
    let galaxySize = baseSize * distanceFactor;

    galaxies.push({
      x: random(-spread, spread),
      y: random(-spread, spread),
      z: random(-depth, -depth * 0.5), // Place them far behind
      size: galaxySize,
      color: color(r, g, b) // Store p5.Color object
    });
  }
  console.log(galaxies.length + " galaxies created."); // Debug log
  console.log("p5 setup() finished"); // Debug log
}

function windowResized() {
  console.log("Window resized"); // Debug log
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // Log only for the first frame to reduce console noise
  if (frameCount < 2) {
      console.log("p5 draw() started");
  }

  background(0);

  // Apply view transformations
  let camZ = (height/2.0) / tan(PI*30.0/180.0); // Default camera Z distance calculation
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0); // Position camera relative to origin

  rotateX(rotX);
  rotateY(rotY);
  scale(zoom); // Apply zoom

  // Center the view on the massive object's XY plane before drawing objects
  translate(-massiveObject.x, -massiveObject.y, -massiveObject.z);


  // --- Draw Lens Glow Effect FIRST (so galaxies draw over it) ---
  drawLensGlow();


  // Example: Check if galaxies array exists and has items before looping
  if (!galaxies || galaxies.length === 0) {
      if(frameCount < 2) console.warn("Galaxies array is missing or empty in draw loop!");
      // Optional: Draw a loading message or skip drawing galaxies
      // return;
  } else {
       // --- Draw Galaxies with Lensing ---
      for (let gal of galaxies) {
          // Calculate distortion based on projected XY position relative to lens
          let distortedPos = calculateDistortion(gal.x, gal.y, massiveObject.x, massiveObject.y);

          push();
          // Draw galaxy at its original Z depth but distorted XY position
          translate(distortedPos.x, distortedPos.y, gal.z);
          // Rotate galaxy slightly? For now, just spheres
          fill(gal.color); // Use assigned galaxy color
          noStroke();
          sphere(gal.size);
          pop();
      }
  }

} // End draw()


function drawLensGlow() {
  push();
  // Center the glow effect on the massive object's world position
  translate(massiveObject.x, massiveObject.y, massiveObject.z);

  let baseRadius = 25; // Base radius of the glow core
  let maxGlowRadius = baseRadius * 12; // How far the glow extends
  let steps = 15; // Ensure this uses 'let', not 'int'

  // Draw layered, transparent ellipses for a radial gradient glow
  noStroke();
  for (let i = steps; i >= 0; i--) {
    let t = i / steps; // Normalized step (1 down to 0)
    let currentRadius = lerp(baseRadius * 0.5, maxGlowRadius, pow(1.0 - t, 0.5));
    let currentAlpha = lerp(0, 70, pow(t, 2)); // Max alpha 70
    let coreColor = color(255, 255, 220, currentAlpha); // Bright yellowish core
    let outerColor = color(255, 180, 100, currentAlpha); // Orangey outer glow
    let currentColor = lerpColor(outerColor, coreColor, pow(t, 1.5)); // Bias towards core color

    fill(currentColor);
    ellipse(0, 0, currentRadius * 2, currentRadius * 2, 24); // Draw ellipse (circle in XY)
  }
  pop();
}


function calculateDistortion(starX, starY, lensX, lensY) {
  // Calculate vector from lens center to star's projected position (in XY plane)
  let dx = starX - lensX;
  let dy = starY - lensY;

  // Squared distance from lens center in the XY plane
  let rSq = dx*dx + dy*dy;

   let minRSq = 10.0; // Minimum distance squared
   if (rSq < minRSq) {
     rSq = minRSq;
   }

  // Gravitational Lensing Approximation:
  let factor = 1 + deflectionStrength / rSq;

  let distortedX = lensX + dx * factor;
  let distortedY = lensY + dy * factor;

  return createVector(distortedX, distortedY);
}


// --- Mouse Interaction Functions ---
function mouseDragged() {
  if (isDragging) {
    let deltaX = mouseX - lastMouseX;
    let deltaY = mouseY - lastMouseY;
    rotY += deltaX * 0.005;
    rotX -= deltaY * 0.005;
    rotX = constrain(rotX, -PI/2 * 0.95, PI/2 * 0.95);
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mousePressed() {
  // Basic check if mouse is over the info box
  let infoBox = select('.info-overlay'); // Requires p5.dom
  try {
      if (infoBox && infoBox.elt && // Check if element was found and exists
          mouseX >= infoBox.position().x && mouseX <= infoBox.position().x + infoBox.width &&
          mouseY >= infoBox.position().y && mouseY <= infoBox.position().y + infoBox.height) {
         isDragging = false;
      } else {
         lastMouseX = mouseX;
         lastMouseY = mouseY;
         isDragging = true;
      }
  } catch (e) {
      console.warn("Error checking info box:", e);
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      isDragging = true;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
   // Check if mouse is over the info box
   let infoBox = select('.info-overlay'); // Requires p5.dom
   try {
       if (infoBox && infoBox.elt && // Check if element was found and exists
          mouseX >= infoBox.position().x && mouseX <= infoBox.position().x + infoBox.width &&
          mouseY >= infoBox.position().y && mouseY <= infoBox.position().y + infoBox.height) {
         return true; // Allow page scrolling
       }
   } catch (e) {
        console.warn("Error checking info box scroll:", e);
   }

   // Otherwise, zoom the canvas
   zoom -= event.delta * 0.001 * zoom; // Scale sensitivity by current zoom
   zoom = constrain(zoom, 0.02, 30); // Wider zoom range
   return false; // Prevent page scrolling
}

// Add a final check to see if the script loaded at all
console.log("sketch.js script loaded and parsed"); // Debug log
