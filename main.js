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
function setSpriteFrame(sprite, frameIndex, mirror = false) {
    let x, y;
    if (!mirror) {
        x = (frameIndex % kartFramesPerColumn) * kartFrameWidth;
        y = Math.floor(frameIndex / kartFramesPerColumn) * kartFrameHeight;
    } else {
        const mirroredFrameIndex = kartFramesPerColumn - frameIndex - 1;
        x = (mirroredFrameIndex % kartFramesPerColumn) * kartFrameWidth;
        y = Math.floor(mirroredFrameIndex / kartFramesPerColumn) * kartFrameHeight;
    }
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
        setSpriteFrame(wheel, 0)
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

function updateChildPositions() {
    // Update position and rotation for the main kart
    const mainKart = kartGroup.children[0];

    // Calculate the positions of wheels and squares relative to the main kart's local space
    const offsetX = 0.65;
    const offsetY = -0.25;
    const offsetZ = 0.74;
    const wheelLocalPositions = [
        new THREE.Vector3(-offsetX, offsetY, -offsetZ),
        new THREE.Vector3(offsetX, offsetY, -offsetZ),
        new THREE.Vector3(-offsetX, offsetY, offsetZ),
        new THREE.Vector3(offsetX, offsetY, offsetZ),
    ];

    // Update positions and rotations for the wheels and squares
    for (let i = 1; i <= 4; i++) {
        const wheel = kartGroup.children[i];
        const square = kartGroup.children[i + 4];

        const wheelLocalPosition = wheelLocalPositions[i - 1];

        // Apply main kart's rotation to wheel local position
        const rotatedWheelLocalPosition = wheelLocalPosition.clone().applyQuaternion(mainKart.quaternion);

        // Calculate position in world space
        const wheelPosition = mainKart.position.clone().add(rotatedWheelLocalPosition);

        // Set positions
        wheel.position.copy(wheelPosition);
        square.position.copy(wheelPosition); // Assuming square positions are the same as wheel positions
    }
}

function updateWheelFrames() {
    let kartRotationY = kartGroup.rotation.y;
    kartRotationY = ((kartRotationY % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2); // Normalize angle to [0, 2π)

    let frameIndex;
    let mirror = false;
    if (kartRotationY <= Math.PI / 2) {
        // Within first 90°, use frameIndex directly
        frameIndex = Math.floor((kartRotationY / (Math.PI / 2)) * kartFramesPerColumn);
    } else if (kartRotationY <= Math.PI) {
        // Between 90° and 180°, mirror frames
        mirror = true;
        const mirroredAngle = Math.PI - kartRotationY; // Calculate mirrored angle
        frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * kartFramesPerColumn);
    } else if (kartRotationY <= Math.PI * 1.5) {
        // Between 180° and 270°, mirror frames
        mirror = true;
        const mirroredAngle = kartRotationY - Math.PI; // Calculate mirrored angle
        frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * kartFramesPerColumn);
    } else {
        // Beyond 270°, use frameIndex directly
        frameIndex = Math.floor(((Math.PI * 2 - kartRotationY) / (Math.PI / 2)) * kartFramesPerColumn);
    }

    // Ensure frameIndex stays within valid range
    frameIndex = (frameIndex + kartFramesPerColumn) % kartFramesPerColumn;
    debugText.innerHTML = `${frameIndex}, ${mirror}, ${kartRotationY}`

    // Update the frame for each wheel
    for (let i = 1; i <= 4; i++) { // Starting from 1 as main kart is at index 0
        const wheel = kartGroup.children[i];
        setSpriteFrame(wheel, frameIndex, mirror);
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
