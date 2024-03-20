// Import Three.js
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

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
    // const mainKartGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const mainKartGeometry = new THREE.BoxGeometry(2, 0.25, 1);
    const mainKartMesh = new THREE.Mesh(mainKartGeometry, mainKartMaterial);
    const mainKartWireframe = new THREE.Mesh(mainKartGeometry, mainKartWireframeMaterial);
    mainKartMesh.add(mainKartWireframe);
    kartGroup.add(mainKartMesh); // Add mainKart to the group
    kartGroup.position.y = -0.5
}
createKart()

// Create a template group that would store a Sprite and DebugSquare
const createWheel = () => {

    const axisHelper = new THREE.AxesHelper(0.5); // Specify the size of the axes (optional)

    // Debug square material
    const debugSquareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const debugSquareMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });

    // Wheel material
    const wheelSpriteTexture = new THREE.TextureLoader().load('wheel_sprite_sheet.png');
    wheelSpriteTexture.magFilter = THREE.NearestFilter; // Set magnification filter
    wheelSpriteTexture.minFilter = THREE.NearestFilter; // Set minification filter
    const wheelSpriteMaterial = new THREE.SpriteMaterial({ map: wheelSpriteTexture });

    // Wheel group
    const wheelGroup = new THREE.Group()

    const wheelSprite = new THREE.Sprite(wheelSpriteMaterial);
    wheelSprite.scale.set(0.5, 0.5, 1); // Scale down the sprite

    // Debug wireframe
    const debugSquareMesh = new THREE.Mesh(debugSquareGeometry, debugSquareMaterial);

    // Debug text
    const textSprite = new SpriteText('#');
    textSprite.textHeight = 0.15

    wheelGroup.add(wheelSprite)
    wheelGroup.add(debugSquareMesh)
    wheelGroup.add(axisHelper)
    wheelGroup.add(textSprite)

    return wheelGroup
}

// Create 4 kart's wheels
const createKartWheels = () => {
    for (let i = 0; i < 4; i++) {
        kartGroup.add(createWheel())
    }
}
createKartWheels()

// Add the group to the scene
scene.add(kartGroup);

// Spritesheet properties
const wheelFramesPerColumn = 15;
const wheelFrameWidth = 32;
const wheelFrameHeight = 32;
const wheelTextureWidth = 480;
const wheelTextureHeight = 32;

// Function to set sprite frame
function setSpriteFrame(sprite, frameIndex, mirror = false) {
    const x = (frameIndex % wheelFramesPerColumn) * wheelFrameWidth;
    const y = Math.floor(frameIndex / wheelFramesPerColumn) * wheelFrameHeight;

    // Calculate texture offsets and repeats
    const offsetX = x / wheelTextureWidth;
    const offsetY = 1 - (y + wheelFrameHeight) / wheelTextureHeight;
    const repeatX = wheelFrameWidth / wheelTextureWidth;
    const repeatY = wheelFrameHeight / wheelTextureHeight;

    // Set texture coordinates
    sprite.material.map.offset.set(offsetX, offsetY);
    sprite.material.map.repeat.set(repeatX, repeatY);

    // Mirror texture horizontally if requested
    if (mirror) {
        sprite.material.map.repeat.x *= -1;
        sprite.material.map.offset.x += repeatX;
    }
}

function updateKartChildPositions() {
    // Update position and rotation for the main kart
    const mainKart = kartGroup.children[0];

    // Calculate the positions of wheel group relative to the main kart's local space
    const offsetX = 0.74;
    const offsetY = 0;
    const offsetZ = 0.65;
    const wheelLocalPositions = [
        new THREE.Vector3(-offsetX, offsetY, -offsetZ),
        new THREE.Vector3(offsetX, offsetY, -offsetZ),
        new THREE.Vector3(-offsetX, offsetY, offsetZ),
        new THREE.Vector3(offsetX, offsetY, offsetZ),
    ];

    // Update positions and rotations for the wheel group
    for (let i = 1; i <= 4; i++) {
        const wheelGroup = kartGroup.children[i]

        const wheelLocalPosition = wheelLocalPositions[i - 1];

        // Apply main kart's rotation to wheel local position
        const rotatedWheelLocalPosition = wheelLocalPosition.clone().applyQuaternion(mainKart.quaternion);

        // Calculate position in world space
        const wheelPosition = mainKart.position.clone().add(rotatedWheelLocalPosition);

        // Set positions
        wheelGroup.position.copy(wheelPosition);
        // if (i == 4) {
        //     wheelGroup.position.y += 0.2
        // }
    }
}

// Function to update the frame for each wheel based on the camera's view


function updateKartWheelFrames() {
    for (let i = 1; i <= 4; i++) {
        const wheelGroup = kartGroup.children[i];
        changeWheelSpriteBasedOnCamera(wheelGroup)
    }
}

function updateTestingWheelFrames() {
    for (let i = 0; i < testingGroup.children.length; i++) {
        const wheelGroup = testingGroup.children[i];
        changeWheelSpriteBasedOnCamera(wheelGroup)
    }
}

function changeWheelSpriteBasedOnCamera(wheelGroup) {
    const wheelSprite = wheelGroup.children[0]
    const wheelText = wheelGroup.children[3]

    // Calculate the angle between the camera's position and the wheel's position
    const relativePosition = wheelGroup.position.clone().sub(camera.position.clone());
    const angleToCamera = Math.atan2(relativePosition.z, relativePosition.x);

    // Calculate the frame index based on the angle between the camera and the wheel
    let frameIndex;
    let mirror = false;
    const normalizedAngle = ((angleToCamera % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

    if (normalizedAngle <= Math.PI / 2) {
        frameIndex = Math.floor((normalizedAngle / (Math.PI / 2)) * wheelFramesPerColumn);
        mirror = true;
    } else if (normalizedAngle <= Math.PI) {
        const mirroredAngle = Math.PI - normalizedAngle;
        frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * wheelFramesPerColumn);
    } else if (normalizedAngle <= Math.PI * 1.5) {
        mirror = true;
        const mirroredAngle = normalizedAngle - Math.PI;
        frameIndex = Math.floor((mirroredAngle / (Math.PI / 2)) * wheelFramesPerColumn);
    } else {
        frameIndex = Math.floor(((Math.PI * 2 - normalizedAngle) / (Math.PI / 2)) * wheelFramesPerColumn);
    }

    // Ensure frameIndex stays within valid range
    frameIndex = (frameIndex + wheelFramesPerColumn) % wheelFramesPerColumn;

    wheelText.text = `${angleToCamera.toFixed(2)}\n${normalizedAngle.toFixed(2)}\n${frameIndex}\n${mirror}`

    // Update the frame for the current wheel
    setSpriteFrame(wheelSprite, frameIndex, mirror);
}

const testingGroup = new THREE.Group()
function createTestingGroup() {
    const numWheels = 25; // Number of wheels in the circle
    const radius = 2.5; // Radius of the circle
    const angleIncrement = (2 * Math.PI) / numWheels; // Angle between each wheel

    for (let i = 0; i < numWheels; i++) {
        // Calculate position of the wheel along the circumference of the circle
        const angle = i * angleIncrement;
        const x = kartGroup.position.x + radius * Math.cos(angle);
        const z = kartGroup.position.z + radius * Math.sin(angle);

        // Create and position the wheel
        const wheel = createWheel();
        wheel.position.set(x, 0, z);
        testingGroup.add(wheel);
    }
}

createTestingGroup()

scene.add(testingGroup)


// Function to update camera position and rotation
function updateCamera() {
    const radius = 2; // Distance of the camera from the kart
    const cameraRotationSpeed = 0.0001; // Speed of camera rotation

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
    // kartGroup.rotation.x += 0.003;
    // kartGroup.rotation.y -= 0.003;

    updateCamera();

    updateKartChildPositions()
    updateTestingWheelFrames()
    updateKartWheelFrames()

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start animation
animate();
