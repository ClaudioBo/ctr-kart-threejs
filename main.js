// Import Three.js
import * as THREE from 'three';

const debugText = document.getElementById('debugText');

// Setup everything
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const kartGroup = new THREE.Group()

// Function to create the kart
const createKart = () => {
    const mainKartMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const mainKartWireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    const geometry = new THREE.BoxGeometry(1, 1, 2);
    const mainKart = new THREE.Mesh(geometry, mainKartMaterial);
    const mainKartWireframe = new THREE.Mesh(geometry, mainKartWireframeMaterial);
    mainKart.add(mainKartWireframe);
    kartGroup.add(mainKart); // Add mainKart to the group
}
createKart()

// Set frame properties
const kartFramesPerColumn = 17;
const kartFrameWidth = 32;
const kartFrameHeight = 32;
const kartTextureWidth = 544;
const kartTextureHeight = 32;

// const kartFramesPerColumn = 13;
// const kartTextureWidth = 1056;

// Function to set sprite frame
function setSpriteFrame(sprite, frameIndex) {
    const x = (frameIndex % kartFramesPerColumn) * kartFrameWidth;
    const y = Math.floor(frameIndex / kartFramesPerColumn) * kartFrameHeight;
    sprite.material.map.offset.set(x / kartTextureWidth, 1 - (y + kartFrameHeight) / kartTextureHeight);
    sprite.material.map.repeat.set(kartFrameWidth / kartTextureWidth, kartFrameHeight / kartTextureHeight);
}

// Create wheels
const createWheels = () => {
    const wheelSpriteTexture = new THREE.TextureLoader().load('wheel_sprite_sheet.png');
    wheelSpriteTexture.magFilter = THREE.NearestFilter; // Set magnification filter
    wheelSpriteTexture.minFilter = THREE.NearestFilter; // Set minification filter
    const wheelSpriteMaterial = new THREE.SpriteMaterial({ map: wheelSpriteTexture });

    for (let i = 0; i < 4; i++) {
        // Create sprite
        const wheel = new THREE.Sprite(wheelSpriteMaterial.clone()); // Clone the material to avoid shared material properties
        setSpriteFrame(wheel, 0, kartFramesPerColumn, kartFrameWidth, kartFrameHeight, kartTextureWidth, kartTextureHeight)
        wheel.scale.set(0.5, 0.5, 1); // Scale down the sprite
        kartGroup.add(wheel);
    }
}
createWheels();

// Function to create squares
const createSquares = () => {
    const squareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const squareWireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    for (let i = 0; i < 4; i++) {
        const square = new THREE.Mesh(squareGeometry, squareWireframeMaterial);
        kartGroup.add(square); // Add square to the group
    }
}
createSquares()

// Add the group to the scene
scene.add(kartGroup);

// Function to rotate all childs from group
function updateChildPositions() {
    const offsetX = 0.65
    const offsetY = -0.25
    const offsetZ = 0.74
    const kartCornersPositions = [
        new THREE.Vector3(-offsetX, offsetY, -offsetZ),
        new THREE.Vector3(offsetX, offsetY, -offsetZ),
        new THREE.Vector3(-offsetX, offsetY, offsetZ),
        new THREE.Vector3(offsetX, offsetY, offsetZ),
    ];

    // Update positions and rotations for main kart, wheels, and squares
    kartCornersPositions.forEach((corner, index) => {
        // Calculate kart position and rotation for the corner
        const cornerKart = corner.clone().applyMatrix4(kartGroup.matrixWorld);

        // Update position and rotation for the main kart
        const mainKart = kartGroup.children[0];
        // mainKart.position.copy(cornerWorld);
        mainKart.rotation.copy(kartGroup.rotation);

        // Update position and rotation for the wheels (assuming consecutive order)
        const wheelIndex = index + 1;
        const wheel = kartGroup.children[wheelIndex];
        wheel.position.copy(cornerKart);
        wheel.rotation.copy(kartGroup.rotation);

        // Update position and rotation for the squares (assuming consecutive order)
        const squareIndex = wheelIndex + 4;
        const square = kartGroup.children[squareIndex];
        square.position.copy(cornerKart);
        square.rotation.copy(kartGroup.rotation);
    });
}

// function updateWheelFrames() {
//     const kartRotationY = kartGroup.rotation.y; // Get the rotation angle of the kart around the y-axis

//     // Calculate frame index based on rotation angle
//     let frameIndex = Math.floor((kartRotationY / (Math.PI / 2)) * kartFramesPerColumn) % kartFramesPerColumn;
//     if (frameIndex < 0) {
//         frameIndex += kartFramesPerColumn; // Ensure frameIndex is positive
//     }

//     // Update the frame for each wheel
//     for (let i = 1; i <= 4; i++) { // Starting from 1 as main kart is at index 0
//         const wheel = kartGroup.children[i];
//         setSpriteFrame(wheel, frameIndex);
//     }
// }

function updateWheelFrames() {
    let kartRotationY = kartGroup.rotation.y;
    kartRotationY = ((kartRotationY % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2); // Normalize angle to [0, 2π)

    let frameIndex;
    if (kartRotationY <= Math.PI / 2) {
        // Within first 90°, use frameIndex directly
        frameIndex = Math.floor((kartRotationY / (Math.PI / 2)) * kartFramesPerColumn) % kartFramesPerColumn;
    } else {
        // Beyond 90°, mirror frames
        const mirroredAngle = Math.PI - kartRotationY; // Calculate mirrored angle
        frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * kartFramesPerColumn) % kartFramesPerColumn;
        
        // Generate mirrored frame if it doesn't exist
        if (frameIndex === 0) {
            // If frameIndex is 0, it means the mirrored frame is the first frame, so we just reverse the rotation
            frameIndex = 1;
        } else {
            // Otherwise, we mirror the existing frame
            frameIndex = kartFramesPerColumn - frameIndex;
        }
    }

    // Update the frame for each wheel
    for (let i = 1; i <= 4; i++) { // Starting from 1 as main kart is at index 0
        const wheel = kartGroup.children[i];
        setSpriteFrame(wheel, frameIndex);
    }
}



// Function to animate the scene
function animate() {
    // Rotate the rectangle
    // rectangle.rotation.x += 0.01;
    kartGroup.rotation.y -= 0.003;

    // Self-explainatory
    updateChildPositions()

    // Self-explainatory
    updateWheelFrames()

    // Render the scene
    renderer.render(scene, camera);

    // Loop
    requestAnimationFrame(animate);
}

// Start animation
animate();
