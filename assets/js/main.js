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
camera.position.x = -1.5
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

// Spritesheet properties
const wheelFramesPerColumn = 17;
const wheelFrameWidth = 32;
const wheelFrameHeight = 32;
const wheelTextureWidth = 544;
const wheelTextureHeight = 32;

// Create a template group that would store the Wheel Group
const createWheel = () => {
    // Debug square material
    const debugSquareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const debugSquareMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });

    // Wheel material
    const wheelSpriteTexture = new THREE.TextureLoader().load('/assets/img/wheel-spritesheet.png');
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

    // Add everything to the group
    wheelGroup.add(wheelSprite)
    wheelGroup.add(debugSquareMesh)
    wheelGroup.add(axesHelper)
    wheelGroup.add(textSprite)

    // Set default frame
    setSpriteFrame(wheelSprite, 0, false, 0)

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

const easeInQuad = t => t * t;

// Helper functions for normalizing values
function normalize(initial_value, current_value, max_value) {
    return (current_value - initial_value) / (max_value - initial_value);
}

// Helper function to make a value close to a step value
function closestStepValue(value, step) {
    return Math.round(value / step) * step
}

function changeWheelSpriteBasedOnCamera(wheelGroup) {
    // Get the world position and rotation of the wheelGroup
    const wheelGroupWorldPosition = wheelGroup.getWorldPosition(new THREE.Vector3());
    const wheelGroupWorldRotation = wheelGroup.getWorldQuaternion(new THREE.Quaternion());

    // Calculate the relative position vector with the camera's position
    const relativePosition = wheelGroupWorldPosition.clone().sub(camera.position);

    // Apply the wheel rotation to the relative position vector
    relativePosition.applyQuaternion(wheelGroupWorldRotation.conjugate());

    // Calculate the angle in degrees to the camera on the X-Z plane
    const angleToCameraX = Math.atan2(relativePosition.z, relativePosition.x) * (180 / Math.PI);

    // Calculate the angle in degrees to the camera on the Y-Z plane
    const angleToCameraY = Math.atan2(relativePosition.y, Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z)) * (180 / Math.PI);

    // Calculate the camera's rotation
    const cameraRotationZ = camera.rotation.z * (-180 / Math.PI);

    // Sum variables
    // const ROTATION_START_ANGLE = 15;
    let frameIndex = 0
    let rotationDegree = 0;
    let isMirror = false

    // Determining mirroring the frame based on angleToCameraX
    if (angleToCameraX < -90 || angleToCameraX > 90) {
        isMirror = true;
    }

    // Select frame based on angleToCameraX
    if (angleToCameraX >= 0 && angleToCameraX <= 90) {
        frameIndex = wheelFramesPerColumn - (angleToCameraX / 90) * wheelFramesPerColumn;
    } else if (angleToCameraX > -90 && angleToCameraX < 0) {
        frameIndex = wheelFramesPerColumn - (-angleToCameraX / 90) * wheelFramesPerColumn;
    } else if (angleToCameraX > -180 && angleToCameraX < -90) {
        frameIndex = wheelFramesPerColumn - ((180 + angleToCameraX) / 90) * wheelFramesPerColumn;
    } else if (angleToCameraX > 90 && angleToCameraX < 180) {
        frameIndex = wheelFramesPerColumn - ((180 - angleToCameraX) / 90) * wheelFramesPerColumn;
    }

    // Select the frame based on angleToCameraY
    const heightFactor = (angleToCameraY + 90) / 180;
    frameIndex = frameIndex * (1 - Math.abs(heightFactor - 0.5) * 2);

    // // Rotation #1: Determine the rotation based on angleToCameraX
    // if (angleToCameraX >= -ROTATION_START_ANGLE && angleToCameraX < ROTATION_START_ANGLE) {
    //     const rotationFactor = normalize(ROTATION_START_ANGLE, angleToCameraX, -ROTATION_START_ANGLE);
    //     rotationDegree += THREE.MathUtils.lerp(-180, 0, 1.0 - rotationFactor);
    // } else if (angleToCameraX < (-180 + ROTATION_START_ANGLE) || angleToCameraX > (180 - ROTATION_START_ANGLE)) {
    //     const adjustedAngle = angleToCameraX > 0 ? angleToCameraX - 180 : angleToCameraX + 180;
    //     const rotationFactor = normalize(ROTATION_START_ANGLE, adjustedAngle, -ROTATION_START_ANGLE);
    //     rotationDegree += THREE.MathUtils.lerp(0, 180, 1.0 - rotationFactor);
    // }

    // // Rotation #1: Keep the rotation if the lerping has ended
    // if (angleToCameraX < -ROTATION_START_ANGLE && angleToCameraX > (-180 + ROTATION_START_ANGLE)) {
    //     rotationDegree += 180
    // }

    // // Auxiliary Rotation: Rotate frame on desired angles (i use this to test without the 1st rotation method)
    // if (angleToCameraX < 0 && angleToCameraX > -180) {
    //     rotationDegree += 180
    // }

    // // Rotation #2ish: Rotate sprite forwards if frameIndex is closer to 0
    // const basedOnIndexFactor = normalize(0, frameIndex, wheelFramesPerColumn)

    // // Rotation #2: Add more rotation based on angleToCameraY
    // const basedOnIndexFactorInterpolated = easeInQuad(basedOnIndexFactor)

    // // Rotation #2: Add more rotation depending on angleToCameraY
    // // basedOnIndexFactor is used to cancel this rotation if frameIndex is closer to 0
    // if (angleToCameraY > 0) {
    //     const rotationFactor = normalize(0, angleToCameraY, 90);
    //     rotationDegree += THREE.MathUtils.lerp(0, 90, rotationFactor) * basedOnIndexFactor;
    // } else if (angleToCameraY <= 0) {
    //     const rotationFactor = normalize(0, angleToCameraY, -90);
    //     rotationDegree += THREE.MathUtils.lerp(0, -90, rotationFactor) * basedOnIndexFactor;
    // }

    // Very promising rotation: 
    rotationDegree = 180
    rotationDegree += cameraRotationZ

    // Debugging text -- Laggy asfuck
    if (wheelGroup.name == "0" && enableDebugShit) {
        wheelGroup.children[3].text = `Wheel #${wheelGroup.name}\nAngle X: ${angleToCameraX.toFixed(0)}\nAngle Y: ${angleToCameraY.toFixed(0)}\nCamera angle: ${cameraRotationZ.toFixed(0)}\nRotation: ${rotationDegree.toFixed(0)}\nFrame: ${frameIndex.toFixed(0)}\nisMirror: ${isMirror}`
    } else {
        wheelGroup.children[3].text = ""
    }

    // Flooring frameIndex because i've finished the calculations
    frameIndex = Math.floor(frameIndex)

    // Update the display properties of the wheel
    setSpriteFrame(wheelGroup.children[0], frameIndex, isMirror, rotationDegree);
}

const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true
// controls.autoRotate = true
controls.autoRotateSpeed *= -1 // Invert rotation
controls.target = kartGroup.position.clone().add(new THREE.Vector3(-0.5750, 0.25, -0.40))

// import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
// const controls = new TrackballControls(camera, renderer.domElement);
// controls.enableDamping = true
// controls.rotateSpeed = 2.0;
// controls.zoomSpeed = 1.2;
// controls.panSpeed = 0.8;

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
    // kartGroup.rotation.y += 0.001
    updateKartChildPositions()
    updateKartWheelFrames()

    controls.update();
    stats.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start animation
animate();
