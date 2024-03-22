// Import Three.js
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

// Setup everything
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e)
let enableDebugShit = true

// // Setup Orthographic Camera
// const camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
// camera.position.x = 4;
// camera.position.y = 0;
// camera.position.z = 0;
// camera.zoom = 250
// camera.zoom = 500
// camera.updateProjectionMatrix()

// Setup Normal Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = -1.5
camera.position.y = 1

// Setup renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

// Setup resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add an ambient light to the scene for overall illumination
// This light intensity matches the model hex colors
const ambientLight = new THREE.AmbientLight(0xffffff, 12.6);
scene.add(ambientLight);

// Create kart group
const kartGroup = new THREE.Group()

// Function to load kart model and materials
const loadKartModelOBJ = async () => {
    // Instanciate the loaders
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    // Load the materials file
    const materials = await new Promise((resolve, reject) => {
        mtlLoader.load('/assets/models/crash_obj/crash.mtl', resolve);
    });

    // Preload materials
    materials.preload()

    // Set the materials to the object loader
    objLoader.setMaterials(materials);

    // Load the object file
    const object = await new Promise((resolve, reject) => {
        objLoader.load('/assets/models/crash_obj/crash.obj', resolve);
    });

    // Loop through each material and apply modifications
    // traverse was needed because iterating with forEach didn't work haha
    object.traverse(child => {
        if (child instanceof THREE.Mesh) {
            if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                    // Enable material vertex colors
                    material.vertexColors = true
                    // Disable texture filtering
                    if (!!material.map) {
                        material.map.magFilter = THREE.NearestFilter;
                        material.map.minFilter = THREE.NearestFilter;
                    }
                });
            }
        }
    });
    return object;
}

// Load kart and save into a variable
const kartModel = await loadKartModelOBJ();

// Function to create the kart
const createKart = () => {
    const mainKartAxesHelper = new THREE.AxesHelper(1)
    const mainKartGroup = kartModel.clone()
    mainKartGroup.add(mainKartAxesHelper)
    kartGroup.add(mainKartGroup); // Add mainKart to the group
}

createKart()

// Create a template group that would store a Sprite and DebugSquare
const createWheel = () => {
    // Debug square material
    const debugSquareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const debugSquareMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });

    // Wheel material
    const wheelSpriteTexture = new THREE.TextureLoader().load('/assets/img/wheel_sprite_sheet.png');
    wheelSpriteTexture.magFilter = THREE.NearestFilter;
    wheelSpriteTexture.minFilter = THREE.NearestFilter;
    wheelSpriteTexture.colorSpace = THREE.SRGBColorSpace;
    const wheelSpriteMaterial = new THREE.SpriteMaterial({ map: wheelSpriteTexture });

    // Wheel group
    const wheelGroup = new THREE.Group()

    const wheelSprite = new THREE.Sprite(wheelSpriteMaterial);
    wheelSprite.scale.set(0.45, 0.45, 1);

    // Debug wireframe
    const debugSquareMesh = new THREE.Mesh(debugSquareGeometry, debugSquareMaterial);

    // Debug text
    const textSprite = new SpriteText('#');
    textSprite.textHeight = 0.035
    textSprite.strokeColor = "black"
    textSprite.strokeWidth = 1

    // Axes just to position the wheels by eye lol
    const axesHelper = new THREE.AxesHelper(0.5)

    wheelGroup.add(wheelSprite)
    wheelGroup.add(debugSquareMesh)
    wheelGroup.add(axesHelper)
    wheelGroup.add(textSprite)

    return wheelGroup
}

// Create 4 kart's wheels
const createKartWheels = () => {
    for (let i = 0; i < 4; i++) {
        const wheelNew = createWheel()
        wheelNew.name = i
        kartGroup.add(wheelNew)
    }
}
createKartWheels()

// Add the group to the scene
scene.add(kartGroup);

// Spritesheet properties
const wheelFramesPerColumn = 17;
const wheelFrameWidth = 32;
const wheelFrameHeight = 32;
const wheelTextureWidth = 544;
const wheelTextureHeight = 32;

// Function to set sprite frame
function setSpriteFrame(sprite, frameIndex, mirror = false, rotationDegree = 0) {
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

    // Rotate texture by degrees
    sprite.material.rotation = rotationDegree * Math.PI / 180; // Convert degrees to radians for Three.js

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
    const offsetY = 0.25;
    const backOffsetX = 0.575;
    const frontOffsetX = 0.575;
    const backOffsetZ = 0.4;
    const frontOffsetZ = 0.8;
    const wheelLocalPositions = [
        new THREE.Vector3(-backOffsetX, offsetY, -backOffsetZ,), // Back right
        new THREE.Vector3(-frontOffsetX, offsetY, frontOffsetZ,), // Front right  
        new THREE.Vector3(backOffsetX, offsetY, -backOffsetZ,), // Back left
        new THREE.Vector3(frontOffsetX, offsetY, frontOffsetZ,), // Front left
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
    }
}

// Functions to update the frame for each wheel based on the camera's view
function updateKartWheelFrames() {
    for (let i = 1; i <= 4; i++) {
        const wheelGroup = kartGroup.children[i];
        changeWheelSpriteBasedOnCamera(wheelGroup)
    }
}

// Helper functions for easing
function easeInOutSine(t) {
    return (1 - Math.cos(Math.PI * t)) / 2;
}

// Helper functions for normalizing values
function normalize(initial_value, current_value, max_value) {
    return (current_value - initial_value) / (max_value - initial_value);
}

// Helper function to make a value close to a step value
function closestStepValue(value, step) {
    return Math.round(value / step) * step
}

function changeWheelSpriteBasedOnCamera(wheelGroup) {
    // Calculate the angle between the camera's position and the wheel's position
    const relativePosition = wheelGroup.position.clone().sub(camera.position);
    const angleToCameraX = Math.atan2(relativePosition.z, relativePosition.x) * (180 / Math.PI);
    const angleToCameraY = Math.atan2(relativePosition.y, Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z)) * (180 / Math.PI);
    const cameraRotationZ = camera.rotation.z * (180 / Math.PI);

    // Frame selection, sprite rotation and mirroring
    let frameIndex;
    let rotationDegree = 0;
    let mirror = false;

    if (angleToCameraX >= 0 && angleToCameraX <= 90) {
        frameIndex = Math.floor(wheelFramesPerColumn - (angleToCameraX / 90) * wheelFramesPerColumn);
    } else if (angleToCameraX > -90 && angleToCameraX < 0) {
        frameIndex = Math.floor(wheelFramesPerColumn - (-angleToCameraX / 90) * wheelFramesPerColumn);
        rotationDegree = 180;
    } else if (angleToCameraX > -180 && angleToCameraX < -90) {
        frameIndex = Math.floor(wheelFramesPerColumn - ((180 + angleToCameraX) / 90) * wheelFramesPerColumn);
        rotationDegree = 180;
        mirror = true;
    } else if (angleToCameraX > 90 && angleToCameraX < 180) {
        frameIndex = Math.floor(wheelFramesPerColumn - ((180 - angleToCameraX) / 90) * wheelFramesPerColumn);
        mirror = true;
    }

    // TODO: There should be a better interpolated rotation imo
    const INTERPOLATION_START_ANGLE = 20; // I don't know since which angle it starts rotating inside the game, im confused
    const INTERPOLATION_STEP_VALUE = 0.1; // Make the rotation more choppy to eliminate the smoothiness and/or replicate the low-fps of the spritesheet
    let rotationFactor = 0
    if (angleToCameraX >= 0 && angleToCameraX < INTERPOLATION_START_ANGLE) {
        rotationFactor = normalize(INTERPOLATION_START_ANGLE, angleToCameraX, 0);
        rotationFactor = closestStepValue(rotationFactor, INTERPOLATION_STEP_VALUE) 
        rotationDegree = THREE.MathUtils.lerp(-180, 0, easeInOutSine(1.0 - rotationFactor));
    } else if (angleToCameraX >= -180 && angleToCameraX <= (-180 + INTERPOLATION_START_ANGLE)) {
        rotationFactor = normalize((-180 + INTERPOLATION_START_ANGLE), angleToCameraX, -180);
        rotationFactor = closestStepValue(rotationFactor, INTERPOLATION_STEP_VALUE)
        rotationDegree = THREE.MathUtils.lerp(0, 180, easeInOutSine(1.0 - rotationFactor));
    }

    // Debugging text -- Laggy asfuck
    if (enableDebugShit) {
        wheelGroup.children[3].text = `Wheel #${wheelGroup.name}\nAngle X: ${angleToCameraX.toFixed(0)}\nAngle Y: ${angleToCameraY.toFixed(0)}\nCamera angle: ${cameraRotationZ.toFixed(0)}\nFrame: ${frameIndex}\nFactor: ${rotationFactor.toFixed(2)}\nRotation: ${rotationDegree.toFixed(0)}\nisMirror: ${mirror}`
    } else {
        wheelGroup.children[3].text = ""
    }

    // Update the frame for the current wheel
    setSpriteFrame(wheelGroup.children[0], frameIndex, mirror, rotationDegree);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true
// controls.autoRotate = true
controls.autoRotateSpeed *= -1 // Invert rotation
controls.target = kartGroup.position.clone().add(new THREE.Vector3(0, 0.5, 0)) // Look a little bit more up

// Function to handle key presses
function onKeyDown(event) {
    if (event.key == "z") toggleDebugShit()
    if (event.key == "x") controls.autoRotate = !controls.autoRotate
    if (event.key == " ") console.log(kartGroup.children[1].children[3].text.replaceAll("\n", ", "))
    if (event.key == "c") {
        camera.position.set(0, 0, 2);
        controls.update();
    }
}
document.addEventListener('keydown', onKeyDown, false);

// Function to toggle rendering on debug shit
function toggleDebugShit() {
    enableDebugShit = !enableDebugShit

    // Axes
    kartGroup.children[0].children[1].visible = enableDebugShit // Kart
    kartGroup.children[1].children[2].visible = enableDebugShit // Wheel #1
    kartGroup.children[2].children[2].visible = enableDebugShit // Wheel #2
    kartGroup.children[3].children[2].visible = enableDebugShit // Wheel #3
    kartGroup.children[4].children[2].visible = enableDebugShit // Wheel #4

    // Wireframe box
    kartGroup.children[1].children[1].visible = enableDebugShit // Wheel #1
    kartGroup.children[2].children[1].visible = enableDebugShit // Wheel #2
    kartGroup.children[3].children[1].visible = enableDebugShit // Wheel #3
    kartGroup.children[4].children[1].visible = enableDebugShit // Wheel #4
}

// Function to animate the scene
function animate() {
    updateKartChildPositions()
    updateKartWheelFrames()

    controls.update();
    stats.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start animation
animate();
