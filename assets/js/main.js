// Import Three.js
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

// ThreeJS variables
let renderer;
let stats;
let ambientLight;

// General variables
let scene;
let camera;
let controls;
let kartGroup;

// Preloaded stuff
let kartModel;

// Properties
let enableDebugShit = false
let choppierRotationMode = 0
let isSoundEnabled = false // To be done
let isAccelerating = false // To be done
let isSmokeDark = false // To be done
let isSmokeVisible = true // To be done

// Spritesheet properties
const wheelTotalFrames = 17;
const wheelFrameWidth = 32;
const wheelFrameHeight = 32;
const wheelTextureWidth = 544;
const wheelTextureHeight = 32;

// Initialize everything
async function initialize() {
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Setup stats counter
    stats = new Stats();
    document.body.appendChild(stats.dom);

    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e)

    // Add an ambient light to the scene for overall illumination
    // This light intensity matches the model hex colors
    ambientLight = new THREE.AmbientLight(0xffffff, 12.6);
    scene.add(ambientLight);

    // Setup camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 0
    camera.position.y = 1
    camera.position.z = -3
    camera.updateProjectionMatrix()

    // Setup camera controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true
    controls.autoRotate = true

    // Load model
    kartModel = await loadKartModelOBJ();

    // Create kart group
    kartGroup = new THREE.Group()

    // Make the camera look at it
    controls.target = kartGroup.position.clone().add(new THREE.Vector3(0, 0.65, 0))

    // Create kart
    createKart()

    // Create 4 Kart's tires
    createKartWheels()

    // Add the Kart to the scene
    scene.add(kartGroup);

    // Write HTML text
    writeDebugText()

    // Register all listeners
    registerListeners();

    // Start loop
    animate();
}

// Register all listeners
function registerListeners() {
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
}

// Function to handle key presses
function onKeyDown(event) {
    if (event.key == "d") toggleDebugShit()
    if (event.key == "x") controls.autoRotate = !controls.autoRotate; writeDebugText()
    if (event.key == "z") {
        camera.position.x = 0
        camera.position.y = 1
        camera.position.z = -3
        camera.updateProjectionMatrix()
        controls.target = kartGroup.position.clone().add(new THREE.Vector3(0, 0.65, 0))
        controls.update();
    }
    if (event.key == "c") {
        choppierRotationMode += 1
        if (choppierRotationMode > 2)
            choppierRotationMode = 0
        writeDebugText()
    }
}

// Resize window function
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Load kart model and materials
async function loadKartModelOBJ() {
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

// Create Kart group
function createKart() {
    const mainKartGroup = kartModel.clone()
    const mainKartAxesHelper = new THREE.AxesHelper(1)
    mainKartAxesHelper.visible = false
    mainKartGroup.add(mainKartAxesHelper)
    kartGroup.add(mainKartGroup);
}

// Create Tire group to clone later
function createWheel() {
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

    // Hide debug shit
    debugSquareMesh.visible = false
    axesHelper.visible = false

    // Add everything to the group
    wheelGroup.add(wheelSprite)
    wheelGroup.add(debugSquareMesh)
    wheelGroup.add(axesHelper)
    wheelGroup.add(textSprite)

    // Set default frame
    setSpriteFrame(wheelSprite, 0, false, 0)

    return wheelGroup
}

// Create 4 Kart's tires
function createKartWheels() {
    for (let i = 0; i < 4; i++) {
        const wheelNew = createWheel()
        wheelNew.name = i
        kartGroup.add(wheelNew)
    }
}

// Function to set sprite frame, mirroring and rotation
function setSpriteFrame(sprite, frameIndex, mirror = false, rotationDegree = 0) {
    const x = (frameIndex % wheelTotalFrames) * wheelFrameWidth;
    const y = Math.floor(frameIndex / wheelTotalFrames) * wheelFrameHeight;

    // Calculate texture offsets and repeats
    const offsetX = x / wheelTextureWidth;
    const offsetY = 1 - (y + wheelFrameHeight) / wheelTextureHeight;
    const repeatX = wheelFrameWidth / wheelTextureWidth;
    const repeatY = wheelFrameHeight / wheelTextureHeight;

    // Set texture coordinates
    sprite.material.map.offset.set(offsetX, offsetY);
    sprite.material.map.repeat.set(repeatX, repeatY);

    // Rotate texture by degrees
    sprite.material.rotation = rotationDegree * Math.PI / 180;

    // Mirror texture horizontally
    if (mirror) {
        sprite.material.map.repeat.x *= -1;
        sprite.material.map.offset.x += repeatX;
    }
}

// TODO: check this shit later bc i think it only needs to be runned once
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

    // Get the camera rotation in degrees
    const cameraRotationZ = camera.rotation.z * (180 / Math.PI);

    // Sum variables
    let frameIndex = 0
    let isMirror = false

    // Very promising and simpler sprite rotation method...
    let rotationDegree = 180 - cameraRotationZ;

    // I'll get the closest step value to make the rotations more choppy on purpose
    // Kinda matching the low frames of the spritesheet, or make the rotations less noticeable
    if (choppierRotationMode == 0) {
        rotationDegree = closestStepValue(rotationDegree, wheelTotalFrames / 2)
    } else if (choppierRotationMode == 1) {
        rotationDegree = closestStepValue(rotationDegree, wheelTotalFrames / 1.5)
    }

    // Determining mirroring the frame based on angleToCameraX
    if (angleToCameraX < -90 || angleToCameraX > 90) {
        isMirror = true;
    }

    // Select frame based on angleToCameraX
    if (angleToCameraX >= 0 && angleToCameraX <= 90) {
        frameIndex = Math.floor(wheelTotalFrames - (angleToCameraX / 90) * wheelTotalFrames);
    } else if (angleToCameraX > -90 && angleToCameraX < 0) {
        frameIndex = Math.floor(wheelTotalFrames - (-angleToCameraX / 90) * wheelTotalFrames);
    } else if (angleToCameraX > -180 && angleToCameraX < -90) {
        frameIndex = Math.floor(wheelTotalFrames - ((180 + angleToCameraX) / 90) * wheelTotalFrames);
    } else if (angleToCameraX > 90 && angleToCameraX < 180) {
        frameIndex = Math.floor(wheelTotalFrames - ((180 - angleToCameraX) / 90) * wheelTotalFrames);
    }

    // Select the frame based on angleToCameraY
    const heightFactor = (angleToCameraY + 90) / 180;
    frameIndex = Math.floor(frameIndex * (1 - Math.abs(heightFactor - 0.5) * 2));

    // Debugging text -- Laggy asfuck
    if (wheelGroup.name == "0" && enableDebugShit) {
        wheelGroup.children[3].text = `Wheel #${wheelGroup.name}\nAngle X: ${angleToCameraX.toFixed(0)}\nAngle Y: ${angleToCameraY.toFixed(0)}\nCamera angle: ${cameraRotationZ.toFixed(0)}\nRotation: ${rotationDegree.toFixed(0)}\nFrame: ${frameIndex.toFixed(0)}\nisMirror: ${isMirror}`
    } else {
        wheelGroup.children[3].text = ""
    }

    // Update the display properties of the wheel
    setSpriteFrame(wheelGroup.children[0], frameIndex, isMirror, rotationDegree);
}

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
    writeDebugText()
}

function writeDebugText() {
    // Too lazy to make enums or smth
    let choppyModeText = ""
    if (choppierRotationMode == 0) choppyModeText = "Normal"
    if (choppierRotationMode == 1) choppyModeText = "Choppier"
    if (choppierRotationMode == 2) choppyModeText = "Disabled"

    const lines = [
        `[S] &mdash; Toggle sound: &mdash; ${isSoundEnabled} (check your volume) « (to be done)`,
        `[D] &mdash; Toggle debug mode: &mdash; ${enableDebugShit}`,
        ``,
        `[Z] &mdash; Reset camera position`,
        `[X] &mdash; Toggle camera autorotation: &mdash; ${controls.autoRotate}`,
        ``,
        `[C] &mdash; Toggle choppy sprite rotation mode: &mdash; ${choppyModeText}`,
        ``,
        `[V] &mdash; Toggle acceleration (sprite flicker and sound): &mdash; ${isAccelerating} « (to be done)`,
        `[B] &mdash; Toggle smoke darkness: &mdash; ${isSmokeDark} « (to be done)`,
        `[N] &mdash; Disable smoke sprite: &mdash; ${isSmokeVisible} « (to be done)`,
        ``,
        `[Space] &mdash; Turbo animation « (to be done)`,
    ]

    const output = lines.join("<br>")
    document.getElementById("debugText").innerHTML = output
}

// Loop function
function animate() {
    updateKartChildPositions()
    updateKartWheelFrames()

    controls.update();
    stats.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start loop
initialize()
