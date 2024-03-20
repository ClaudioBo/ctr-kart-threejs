// Import Three.js
import * as THREE from 'three';

const debugText = document.getElementById('debugText');

// Setup everything
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 4.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const kartGroup = new THREE.Group()

// Function to create the kart
const createKart = () => {
    const mainKartMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const mainKartWireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    const geometry = new THREE.BoxGeometry(2, 0.25, 1);
    const mainKart = new THREE.Mesh(geometry, mainKartMaterial);
    const mainKartWireframe = new THREE.Mesh(geometry, mainKartWireframeMaterial);
    mainKart.add(mainKartWireframe);
    kartGroup.add(mainKart); // Add mainKart to the group
}
createKart()

// Set frame properties
const kartFramesPerColumn = 15;
const kartFrameWidth = 32;
const kartFrameHeight = 32;
const kartTextureWidth = 480;
const kartTextureHeight = 32;

// const kartFramesPerColumn = 13;
// const kartTextureWidth = 1056;

// Function to set sprite frame
function setSpriteFrame(sprite, frameIndex, mirror = false) {
    const x = (frameIndex % kartFramesPerColumn) * kartFrameWidth;
    const y = Math.floor(frameIndex / kartFramesPerColumn) * kartFrameHeight;

    // Calculate texture offsets and repeats
    const offsetX = x / kartTextureWidth;
    const offsetY = 1 - (y + kartFrameHeight) / kartTextureHeight;
    const repeatX = kartFrameWidth / kartTextureWidth;
    const repeatY = kartFrameHeight / kartTextureHeight;

    // Set texture coordinates
    sprite.material.map.offset.set(offsetX, offsetY);
    sprite.material.map.repeat.set(repeatX, repeatY);

    // Mirror texture horizontally if requested
    if (mirror) {
        sprite.material.map.repeat.x *= -1;
        sprite.material.map.offset.x += repeatX;
    }
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
    const offsetX = 0.74;
    const offsetY = -0.25;
    const offsetZ = 3.65;
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
        if(i==4){
            wheel.position.y+=1
        }
    }
}

// Function to update the frame for each wheel based on the camera's view
function updateWheelFrames() {
    for (let i = 1; i <= 4; i++) {
        const wheel = kartGroup.children[i];

        // Calculate the angle between the camera's position and the wheel's position
        const relativePosition = wheel.position.clone().sub(camera.position);
        const angleToCamera = Math.atan2(relativePosition.z, relativePosition.x);

        // Calculate the frame index based on the angle between the camera and the wheel
        let frameIndex;
        let mirror = false;
        const normalizedAngle = ((angleToCamera % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

        if (normalizedAngle <= Math.PI / 2) {
            frameIndex = Math.floor((normalizedAngle / (Math.PI / 2)) * kartFramesPerColumn);
            mirror = true;
        } else if (normalizedAngle <= Math.PI) {
            const mirroredAngle = Math.PI - normalizedAngle;
            frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * kartFramesPerColumn);
        } else if (normalizedAngle <= Math.PI * 1.5) {
            mirror = true;
            const mirroredAngle = normalizedAngle - Math.PI;
            frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * kartFramesPerColumn);
        } else {
            frameIndex = Math.floor(((Math.PI * 2 - normalizedAngle) / (Math.PI / 2)) * kartFramesPerColumn);
        }

        // Ensure frameIndex stays within valid range
        frameIndex = (frameIndex + kartFramesPerColumn) % kartFramesPerColumn;

        // Update the frame for the current wheel
        setSpriteFrame(wheel, frameIndex, mirror);
    }
}

// Function to update camera position and rotation
function updateCamera() {
    const radius = 5; // Distance of the camera from the kart
    const cameraRotationSpeed = 0.001; // Speed of camera rotation

    // Calculate new angle for the camera
    const cameraAngle = Date.now() * cameraRotationSpeed;

    // Calculate new position for the camera based on its rotation around the kart
    const cameraX = kartGroup.position.x + radius * Math.cos(cameraAngle);
    const cameraZ = kartGroup.position.z + radius * Math.sin(cameraAngle);

    // Set the new position for the camera
    camera.position.set(cameraX, 0, cameraZ);

    // Set the camera to look at the kart
    camera.lookAt(kartGroup.position);
}

// Function to animate the scene
function animate() {
    // Rotate the rectangle
    // kartGroup.rotation.x += 0.003;
    // kartGroup.rotation.y -= 0.003;

    // Update the camera position and rotation
    updateCamera();

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
