let stars = [];
const numStars = 1000;
let massiveObject;
let zoom = 1;
let isDragging = false;
let lastMouseX, lastMouseY;
let rotX = 0;
let rotY = 0;
let canvas; // Added variable to hold the canvas element

function setup() {
  // Create canvas and parent it to the div with id 'canvas-container'
  canvas = createCanvas(800, 600, WEBGL); // Adjusted size slightly
  canvas.parent('canvas-container');

  // Create background stars
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(-width * 1.5, width * 1.5),   // Increased random range
      y: random(-height * 1.5, height * 1.5), // Increased random range
      z: random(-2000, -500),                 // Increased depth range
      size: random(1, 3)
    });
  }

  // Create massive object (e.g., black hole or galaxy)
  massiveObject = {
    x: 0,
    y: 0,
    z: -200,
    mass: 500  // Adjust mass to control distortion strength
  };
}

function draw() {
  background(0);

  // Apply rotations and zoom
  // Use orbital control for more intuitive rotation if desired (see notes below)
  rotateX(rotX);
  rotateY(rotY);
  scale(zoom);

  // Draw massive object
  push();
  translate(massiveObject.x, massiveObject.y, massiveObject.z);
  noStroke();
  fill(100, 100, 255, 200); // Slightly transparent blue
  sphere(30); // Size of the central object
  pop();

  // Draw stars with gravitational lensing effect
  for (let star of stars) {
    let distortedPosition = calculateDistortion(star);

    push();
    translate(distortedPosition.x, distortedPosition.y, star.z);
    fill(255);
    noStroke();
    sphere(star.size);
    pop();
  }

  // Draw lensing effect (optional visual cue)
  // drawLensingEffect(); // Uncomment if you want the blue line effect
}

function calculateDistortion(star) {
  // Calculate vector from massive object to star's original position
  let dx = star.x - massiveObject.x;
  let dy = star.y - massiveObject.y;
  // Note: Simplified 2D distance calculation for distortion for performance/simplicity
  let distSqXY = dx*dx + dy*dy; // Use squared distance in XY plane

  // Avoid division by zero or extreme distortion very close to the center
  if (distSqXY < 100) { // Minimum distance cutoff (adjust as needed)
      distSqXY = 100;
  }

  // Simplified lensing formula: angle deflection proportional to mass / impact parameter (distance)
  // This is a visual approximation, not physically precise General Relativity
  let distortionFactor = (massiveObject.mass * 4) / distSqXY; // Scaled mass influence

  // Apply distortion radially outward in the XY plane
  let distortedX = star.x + dx * distortionFactor;
  let distortedY = star.y + dy * distortionFactor;

  // Return only the distorted X and Y; Z remains unchanged in this simple model
  // We pass star.z through in the main draw loop's translate function
  return createVector(distortedX, distortedY);
}


// Optional: Kept the lensing effect drawing function if you want to use it
function drawLensingEffect() {
  push();
  translate(massiveObject.x, massiveObject.y, massiveObject.z); // Center effect on object
  noFill();
  stroke(100, 100, 255, 30); // Very faint blue
  strokeWeight(1);
  let effectRadius = sqrt(massiveObject.mass) * 2; // Radius related to mass

  // Draw concentric circles as a visual guide for the distortion field
  for (let r = effectRadius * 0.5; r < effectRadius * 3; r*= 1.5){
      ellipse(0, 0, r*2, r*2, 50); // Draw circle in XY plane at object's Z
  }

  // Original line effect (can be performance intensive)
  /*
  strokeWeight(2);
  for (let angle = 0; angle < TWO_PI; angle += 0.2) {
     let radius = massiveObject.mass * 0.5;
     let x = radius * cos(angle);
     let y = radius * sin(angle);
     let z = 0; // Relative z

     beginShape();
     for (let t = 0; t <= 1; t += 0.2) {
       let lensedX = lerp(x, x * 1.5, t);
       let lensedY = lerp(y, y * 1.5, t);
       let lensedZ = lerp(z, z - 100, t);
       vertex(lensedX, lensedY, lensedZ);
     }
     endShape();
  }
  */
  pop();
}


function mouseDragged() {
  // More intuitive rotation: change in mouse X affects Y rotation, change in Y affects X rotation
  if (isDragging) {
    let deltaX = mouseX - lastMouseX;
    let deltaY = mouseY - lastMouseY;
    // Adjust sensitivity by changing the multiplier (e.g., 0.01)
    rotY += deltaX * 0.01;
    rotX -= deltaY * 0.01; // Inverted Y for standard screen coords
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mousePressed() {
  // Make sure the press is within the canvas
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    isDragging = true;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
   // Make sure the scroll happens over the canvas
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    zoom -= event.delta * 0.001; // Adjusted sensitivity
    zoom = constrain(zoom, 0.3, 7); // Adjusted zoom limits
    return false; // Prevent page scrolling
  }
}