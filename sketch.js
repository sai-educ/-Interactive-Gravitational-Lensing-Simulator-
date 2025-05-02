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
// Increased radius/strength for more pronounced effect like the image
let einsteinRadiusSq = 15000; // Controls the 'size' of the lensing effect area (squared)
let deflectionStrength = einsteinRadiusSq * 1.2; // Strength of deflection, related to Einstein Radius
// -----------------------------------------


function setup() {
  // Create canvas filling the window
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('canvas-container'); // Attach to the container div

  // Define massive object (acts as the lens)
  massiveObject = {
    x: 0,
    y: 0,
    z: 0,
  };

  // Create background galaxies spread wider and deeper
  let spread = max(width, height) * 4; // Increased spread further
  let depth = spread * 2;
  for (let i = 0; i < numGalaxies; i++) {
    // --- Galaxy Color ---
    let r = random(180, 255);
    let g = random(180, 255);
    let b = random(180, 255);
    // Bias towards white/yellow/light blue - adjust probabilities as desired
    let randColor = random();
    if (randColor < 0.3) { // Bluish tint
        b = 255;
        g = random(180, 230);
        r = random(180, 230);
    } else if (randColor < 0.6) { // Yellowish/Orangish tint
        b = random(150, 200);
        g = random(200, 255); // Keep green higher for yellow
        r = 255;
    } // Remaining are more whitish

    // --- Galaxy Size ---
    let baseSize = random(1.5, 4.5);
    // Make distant galaxies appear smaller (simple Z-based scaling)
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
   // Sort galaxies by Z for potentially better rendering order (optional)
   // galaxies.sort((a, b) => a.z - b.z);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  // Apply view transformations
  // Adjust camera Z based on FOV for consistent view distance on zoom
  let camZ = (height/2.0) / tan(PI*30.0/180.0); // Default camera Z distance calculation
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0); // Position camera relative to origin

  rotateX(rotX);
  rotateY(rotY);
  scale(zoom); // Apply zoom

  // Center the view on the massive object's XY plane before drawing objects
  translate(-massiveObject.x, -massiveObject.y, -massiveObject.z);


  // --- Draw Lens Glow Effect FIRST (so galaxies draw over it) ---
  drawLensGlow();


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


} // End draw()


function drawLensGlow() {
  push();
  // Center the glow effect on the massive object's world position
  translate(massiveObject.x, massiveObject.y, massiveObject.z);

  // Rotate the glow planes to roughly face the camera?
  // Billboarding is complex in p5 webgl without shaders.
  // Instead, draw in XY plane and rely on viewing angle.
  // Or, apply inverse rotation of camera - tricky to get right. Let's keep it simple.

  let baseRadius = 25; // Base radius of the glow core
  let maxGlowRadius = baseRadius * 12; // How far the glow extends
  int steps = 15; // Number of layers for smoother gradient

  // Draw layered, transparent ellipses for a radial gradient glow
  noStroke();
  for (let i = steps; i >= 0; i--) {
    let t = i / steps; // Normalized step (1 down to 0)

    // Interpolate radius - make it spread non-linearly (e.g., faster at edges)
    let currentRadius = lerp(baseRadius * 0.5, maxGlowRadius, pow(1.0 - t, 0.5));

    // Interpolate alpha - make it fade out (stronger near center)
    // Use ease-out curve (e.g., quadratic)
    let currentAlpha = lerp(0, 70, pow(t, 2)); // Max alpha 70

    // Interpolate color - e.g., from bright yellow/white core to orange/reddish outer glow
    let coreColor = color(255, 255, 220, currentAlpha); // Bright yellowish core
    let outerColor = color(255, 180, 100, currentAlpha); // Orangey outer glow
    let currentColor = lerpColor(outerColor, coreColor, pow(t, 1.5)); // Bias towards core color

    fill(currentColor);
    ellipse(0, 0, currentRadius * 2, currentRadius * 2, 24); // Draw ellipse (circle in XY), lower detail ok
  }
  pop();
}


function calculateDistortion(starX, starY, lensX, lensY) {
  // Calculate vector from lens center to star's projected position (in XY plane)
  let dx = starX - lensX;
  let dy = starY - lensY;

  // Squared distance from lens center in the XY plane
  let rSq = dx*dx + dy*dy;

  // If rSq is very small, star is essentially behind the lens center.
  // To prevent division by zero and create a central "hole" or avoid artifacts:
  // Option 1: Return a position far away (effectively hiding it)
  // Option 2: Return the lens position (causes stacking)
  // Option 3: Use a minimum rSq (creates flat core) -> Let's use this
   let minRSq = 10.0; // Minimum distance squared - prevents extreme stretching at center
   if (rSq < minRSq) {
     rSq = minRSq;
     // Optional: could also slightly randomize position near center if rSq is tiny
   }


  // Gravitational Lensing Approximation:
  // theta_vec approx = beta_vec * (1 + Deflection_Strength / rSq)
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
  // Basic check if mouse is over the info box - if so, don't start drag
  let infoBox = select('.info-overlay');
  if (infoBox && mouseX >= infoBox.position().x && mouseX <= infoBox.position().x + infoBox.width &&
      mouseY >= infoBox.position().y && mouseY <= infoBox.position().y + infoBox.height) {
     // Clicked inside info box, do nothing for dragging
     isDragging = false;
  } else {
     // Clicked outside info box
     lastMouseX = mouseX;
     lastMouseY = mouseY;
     isDragging = true;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
   // Check if mouse is over the info box - if so, allow default scroll
   let infoBox = select('.info-overlay');
   if (infoBox && mouseX >= infoBox.position().x && mouseX <= infoBox.position().x + infoBox.width &&
       mouseY >= infoBox.position().y && mouseY <= infoBox.position().y + infoBox.height) {
      return true; // Allow page scrolling within info box
   }

   // Otherwise, zoom the canvas
   zoom -= event.delta * 0.001 * zoom; // Scale sensitivity by current zoom
   zoom = constrain(zoom, 0.02, 30); // Wider zoom range
   return false; // Prevent page scrolling
}