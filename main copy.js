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

// Function to set sprite frame
function setSpriteFrame(sprite, frameIndex, framesPerColumn, frameWidth, frameHeight, textureWidth, textureHeight) {
    const x = (frameIndex % framesPerColumn) * frameWidth;
    const y = Math.floor(frameIndex / framesPerColumn) * frameHeight;
    sprite.material.map.offset.set(x / textureWidth, 1 - (y + frameHeight) / textureHeight);
    sprite.material.map.repeat.set(frameWidth / textureWidth, frameHeight / textureHeight);
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
    const corners = [
        new THREE.Vector3(-offsetX, offsetY, -offsetZ),
        new THREE.Vector3(offsetX, offsetY, -offsetZ),
        new THREE.Vector3(-offsetX, offsetY, offsetZ),
        new THREE.Vector3(offsetX, offsetY, offsetZ),
    ];

    // Update positions and rotations for main kart, wheels, and squares
    corners.forEach((corner, index) => {
        // Calculate world position and rotation for the corner
        const cornerWorld = corner.clone().applyMatrix4(kartGroup.matrixWorld);

        // Update position and rotation for the main kart
        const mainKart = kartGroup.children[0];
        // mainKart.position.copy(cornerWorld);
        mainKart.rotation.copy(kartGroup.rotation);

        // Update position and rotation for the wheels (assuming consecutive order)
        const wheelIndex = index + 1;
        const wheel = kartGroup.children[wheelIndex];
        wheel.position.copy(cornerWorld);
        wheel.rotation.copy(kartGroup.rotation);

        // Update position and rotation for the squares (assuming consecutive order)
        const squareIndex = wheelIndex + 4;
        const square = kartGroup.children[squareIndex];
        square.position.copy(cornerWorld);
        square.rotation.copy(kartGroup.rotation);

        // Update wheels frame
    });
}




// // Function to update square positions
// function updateSquarePositions() {
//     const corners = [
//         new THREE.Vector3(-0.65, -0.25, -0.74),
//         new THREE.Vector3(0.65, -0.25, -0.74),
//         new THREE.Vector3(-0.65, -0.25, 0.74),
//         new THREE.Vector3(0.65, -0.25, 0.74),
//     ];

//     corners.forEach((corner, index) => {
//         const square = squares[index];
//         const cornerWorld = corner.clone().applyMatrix4(mainKart.matrixWorld); // Convert corner position to world space
//         square.position.copy(cornerWorld);
//         square.rotation.copy(mainKart.rotation);
//     });
// }





// // Function to update sprite positions based on square positions
// function updateSpritePositions() {
//     const corners = [
//         new THREE.Vector3(-0.65, -0.25, -0.74),
//         new THREE.Vector3(0.65, -0.25, -0.74),
//         new THREE.Vector3(-0.65, -0.25, 0.74),
//         new THREE.Vector3(0.65, -0.25, 0.74),
//     ];

//     corners.forEach((corner, index) => {
//         const sprite = wheels[index];
//         const cornerWorld = corner.clone().applyMatrix4(mainKart.matrixWorld); // Convert corner position to world space
//         sprite.position.copy(cornerWorld);
//         sprite.rotation.copy(mainKart.rotation);
//     });
// }


// // Function to set sprite frame
// function setSpriteFrame(sprite, frameIndex, framesPerColumn, frameWidth, frameHeight, textureWidth, textureHeight) {
//     const x = (frameIndex % framesPerColumn) * frameWidth;
//     const y = Math.floor(frameIndex / framesPerColumn) * frameHeight;
//     sprite.material.map.offset.set(x / textureWidth, 1 - (y + frameHeight) / textureHeight);
//     sprite.material.map.repeat.set(frameWidth / textureWidth, frameHeight / textureHeight);
// }

// // Set frame properties
// const framesPerColumn = 17;
// const frameWidth = 32;
// const frameHeight = 32;
// const textureWidth = 544;
// const textureHeight = 32;

// // Set initial sprite frame for each sprite
// wheels.forEach(sprite => setSpriteFrame(sprite, 0, framesPerColumn, frameWidth, frameHeight, textureWidth, textureHeight));

// // debugText.innerHTML = `Sprite.rotation.y: ${sprite.rotation.y.toFixed(2)}`;

// // Function to update sprite frame based on camera position
// function updateSpriteFrames() {
//     const cameraDirection = new THREE.Vector3();
//     camera.getWorldDirection(cameraDirection);

//     wheels.forEach(sprite => {
//         const spriteDirection = sprite.position.clone().sub(camera.position).normalize();
//         const angle = cameraDirection.angleTo(spriteDirection);

//         // Adjust angle to the range [0, 2π]
//         let adjustedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

//         const totalFrames = 17; // Total frames in the sprite sheet
//         let frameIndex;

//         // Calculate the frame index based on the angle
//         frameIndex = Math.floor((adjustedAngle / (Math.PI * 2)) * totalFrames);

//         // debugText.innerHTML = `${sprite.rotation.y}`

//         setSpriteFrame(sprite, frameIndex, framesPerColumn, frameWidth, frameHeight, textureWidth, textureHeight);
//     });
// }

// console.log(angle, adjustedAngle, frameIndex)
// mainKart.rotation.y = 1.57
// mainKart.rotation.x = 0.5








// Function to animate the scene
function animate() {
    requestAnimationFrame(animate);

    // Rotate the rectangle
    // rectangle.rotation.x += 0.01;
    kartGroup.rotation.y -= 0.003;

    updateChildPositions()

    // Update sprite positions
    // updateSpritePositions();

    // Update sprite frame based on camera view angle
    // updateSpriteFrames();

    // Update mini square positions
    // updateSquarePositions();

    // Render the scene
    renderer.render(scene, camera);
}


// Start animation
animate();
