// Import Three.js
import * as THREE from 'three';

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a gray material
const material = new THREE.MeshBasicMaterial({ color: 0x888888 });

// Create a wireframe material
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });

// Create a geometry (box)
const geometry = new THREE.BoxGeometry(1, 1, 2);

// Create a mesh with the geometry and material
const rectangle = new THREE.Mesh(geometry, material);

// Create a wireframe mesh
const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
rectangle.add(wireframe); // Add wireframe as a child of the rectangle

// Add the rectangle to the scene
scene.add(rectangle);

// Load sprite texture
const spriteTexture = new THREE.TextureLoader().load('wheel_sprite_sheet.png');
spriteTexture.magFilter = THREE.NearestFilter; // Set magnification filter
spriteTexture.minFilter = THREE.NearestFilter; // Set minification filter
const spriteMaterial = new THREE.SpriteMaterial({ map: spriteTexture });

// Create sprites for each corner
const sprites = [];
for (let i = 0; i < 4; i++) {
    const sprite = new THREE.Sprite(spriteMaterial.clone()); // Clone the material to avoid shared material properties
    sprite.scale.set(0.5, 0.5, 1); // Scale down the sprite
    sprites.push(sprite);
    scene.add(sprite);
}

// Function to update sprite positions
function updateSpritePositions() {
    const corners = [
        // Traseras
        new THREE.Vector3(-0.5, -0.5, -1), 
        new THREE.Vector3(0.5, -0.5, -1), 
        // Frontales
        new THREE.Vector3(-0.5, -0.5, 1), 
        new THREE.Vector3(0.5, -0.5, 1), 
    ];

    corners.forEach((corner, index) => {
        const sprite = sprites[index];
        const cornerWorld = corner.applyMatrix4(rectangle.matrixWorld); // Convert corner position to world space
        sprite.position.copy(cornerWorld);
    });
}

// Function to set sprite frame
function setSpriteFrame(sprite, frameIndex, framesPerRow, frameWidth, frameHeight, textureWidth, textureHeight) {
    const x = (frameIndex % framesPerRow) * frameWidth;
    const y = Math.floor(frameIndex / framesPerRow) * frameHeight;
    sprite.material.map.offset.set(x / textureWidth, 1 - (y + frameHeight) / textureHeight);
    sprite.material.map.repeat.set(frameWidth / textureWidth, frameHeight / textureHeight);
}

// Set frame properties
const framesPerRow = 17;
const frameWidth = 32;
const frameHeight = 32;
const textureWidth = 544;
const textureHeight = 32;

// Set initial sprite frame for each sprite
sprites.forEach(sprite => setSpriteFrame(sprite, 0, framesPerRow, frameWidth, frameHeight, textureWidth, textureHeight));

const debugText = document.getElementById('debugText');
// debugText.innerHTML = `Sprite.rotation.y: ${sprite.rotation.y.toFixed(2)}`;

// Function to update sprite frame based on camera position
function updateSpriteFrames() {
    const cameraDirection = new THREE.Vector3(); // Camera's direction vector
    camera.getWorldDirection(cameraDirection); // Get the direction the camera is facing

    const cameraUp = new THREE.Vector3(0, 1, 0); // Camera's up vector

    // Calculate frame index for each sprite based on camera direction
    sprites.forEach(sprite => {
        const spritePosition = sprite.getWorldPosition(new THREE.Vector3()); // Get sprite's world position
        const vectorToSprite = spritePosition.clone().sub(camera.position).normalize(); // Vector from camera to sprite

        // Calculate angle between camera direction and vector to sprite
        const angle = Math.atan2(vectorToSprite.x, vectorToSprite.z) - Math.atan2(cameraDirection.x, cameraDirection.z);

        // Convert angle to frame index
        let frameIndex = Math.round(angle / (Math.PI * 2 / framesPerRow)) % framesPerRow;
        if (frameIndex < 0) {
            frameIndex += framesPerRow; // Ensure positive frame index
        }

        // Set frame for sprite
        setSpriteFrame(sprite, frameIndex, framesPerRow, frameWidth, frameHeight, textureWidth, textureHeight);

        // Calculate vertical rotation of sprite based on camera up vector and rectangle up vector
        const rectangleUp = new THREE.Vector3(0, 1, 0); // Rectangle's up vector
        const rotationAngle = Math.acos(THREE.MathUtils.clamp(cameraUp.dot(rectangleUp), -1, 1));
        sprite.rotation.y = rotationAngle;
    });
}

// Function to animate the scene
function animate() {
    requestAnimationFrame(animate);

    // Rotate the rectangle
    // rectangle.rotation.x += 0.01;
    rectangle.rotation.y += 0.01;

    // Update sprite positions
    updateSpritePositions();

    // Update sprite frame based on camera view angle
    updateSpriteFrames();

    // Render the scene
    renderer.render(scene, camera);
}


// Start animation
animate();
