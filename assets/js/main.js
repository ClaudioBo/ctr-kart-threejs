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
const tireTotalFrames = 17;
const tireFrameWidth = 32;
const tireFrameHeight = 32;
const tireTextureWidth = 544;
const tireTextureHeight = 32;

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
    createKartTires()

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
function createTire() {
    // Debug square material
    const debugSquareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const debugSquareMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });

    // Tire material
    const tireSpriteTexture = new THREE.TextureLoader().load('/assets/img/tire-spritesheet.png');
    tireSpriteTexture.magFilter = THREE.NearestFilter;
    tireSpriteTexture.minFilter = THREE.NearestFilter;
    tireSpriteTexture.colorSpace = THREE.SRGBColorSpace;
    const tireSpriteMaterial = new THREE.SpriteMaterial({ map: tireSpriteTexture });

    // Tire group
    const tireGroup = new THREE.Group()

    const tireSprite = new THREE.Sprite(tireSpriteMaterial);
    tireSprite.scale.set(0.45, 0.45, 1);

    // Debug wireframe
    const debugSquareMesh = new THREE.Mesh(debugSquareGeometry, debugSquareMaterial);

    // Debug text
    const textSprite = new SpriteText('#');
    textSprite.textHeight = 0.035
    textSprite.strokeColor = "black"
    textSprite.strokeWidth = 1

    // Axes just to position the tires by eye lol
    const axesHelper = new THREE.AxesHelper(0.5)

    // Hide debug shit
    debugSquareMesh.visible = false
    axesHelper.visible = false

    // Add everything to the group
    tireGroup.add(tireSprite)
    tireGroup.add(debugSquareMesh)
    tireGroup.add(axesHelper)
    tireGroup.add(textSprite)

    // Set default frame
    setSpriteFrame(tireSprite, 0, false, 0)

    return tireGroup
}

// Create 4 Kart's tires
function createKartTires() {
    for (let i = 0; i < 4; i++) {
        const tireNew = createTire()
        tireNew.name = i
        kartGroup.add(tireNew)
    }
}

// Function to set sprite frame, mirroring and rotation
function setSpriteFrame(sprite, frameIndex, mirror = false, rotationDegree = 0) {
    const x = (frameIndex % tireTotalFrames) * tireFrameWidth;
    const y = Math.floor(frameIndex / tireTotalFrames) * tireFrameHeight;

    // Calculate texture offsets and repeats
    const offsetX = x / tireTextureWidth;
    const offsetY = 1 - (y + tireFrameHeight) / tireTextureHeight;
    const repeatX = tireFrameWidth / tireTextureWidth;
    const repeatY = tireFrameHeight / tireTextureHeight;

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

    // Calculate the positions of tire group relative to the main kart's local space
    const offsetY = 0.25;
    const backOffsetX = 0.575;
    const frontOffsetX = 0.575;
    const backOffsetZ = 0.4;
    const frontOffsetZ = 0.8;
    const tireLocalPositions = [
        new THREE.Vector3(-backOffsetX, offsetY, -backOffsetZ,), // Back right
        new THREE.Vector3(-frontOffsetX, offsetY, frontOffsetZ,), // Front right
        new THREE.Vector3(backOffsetX, offsetY, -backOffsetZ,), // Back left
        new THREE.Vector3(frontOffsetX, offsetY, frontOffsetZ,), // Front left
    ];

    // Update positions and rotations for the tire group
    for (let i = 1; i <= 4; i++) {
        const tireGroup = kartGroup.children[i]

        const tireLocalPosition = tireLocalPositions[i - 1];

        // Apply main kart's rotation to tire local position
        const rotatedTireLocalPosition = tireLocalPosition.clone().applyQuaternion(mainKart.quaternion);

        // Calculate position in world space
        const tirePosition = mainKart.position.clone().add(rotatedTireLocalPosition);

        // Set positions
        tireGroup.position.copy(tirePosition);
    }
}

// Functions to update the frame for each tire based on the camera's view
function updateKartTireFrames() {
    for (let i = 1; i <= 4; i++) {
        const tireGroup = kartGroup.children[i];
        changeTireSpriteBasedOnCamera(tireGroup)
    }
}

// Helper function to make a value close to a step value
function closestStepValue(value, step) {
    return Math.round(value / step) * step
}

function changeTireSpriteBasedOnCamera(tireGroup) {
    // Get the world position and rotation of the tireGroup
    const tireGroupWorldPosition = tireGroup.getWorldPosition(new THREE.Vector3());
    const tireGroupWorldRotation = tireGroup.getWorldQuaternion(new THREE.Quaternion());

    // Calculate the relative position vector with the camera's position
    const relativePosition = tireGroupWorldPosition.clone().sub(camera.position);

    // Apply the tire rotation to the relative position vector
    relativePosition.applyQuaternion(tireGroupWorldRotation.conjugate());

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
        rotationDegree = closestStepValue(rotationDegree, tireTotalFrames / 2)
    } else if (choppierRotationMode == 1) {
        rotationDegree = closestStepValue(rotationDegree, tireTotalFrames / 1.5)
    }

    // Determining mirroring the frame based on angleToCameraX
    if (angleToCameraX < -90 || angleToCameraX > 90) {
        isMirror = true;
    }

    // Select frame based on angleToCameraX
    if (angleToCameraX >= 0 && angleToCameraX <= 90) {
        frameIndex = Math.floor(tireTotalFrames - (angleToCameraX / 90) * tireTotalFrames);
    } else if (angleToCameraX > -90 && angleToCameraX < 0) {
        frameIndex = Math.floor(tireTotalFrames - (-angleToCameraX / 90) * tireTotalFrames);
    } else if (angleToCameraX > -180 && angleToCameraX < -90) {
        frameIndex = Math.floor(tireTotalFrames - ((180 + angleToCameraX) / 90) * tireTotalFrames);
    } else if (angleToCameraX > 90 && angleToCameraX < 180) {
        frameIndex = Math.floor(tireTotalFrames - ((180 - angleToCameraX) / 90) * tireTotalFrames);
    }

    // Select the frame based on angleToCameraY
    const heightFactor = (angleToCameraY + 90) / 180;
    frameIndex = Math.floor(frameIndex * (1 - Math.abs(heightFactor - 0.5) * 2));

    // Debugging text -- Laggy asfuck
    if (tireGroup.name == "0" && enableDebugShit) {
        tireGroup.children[3].text = `Tire #${tireGroup.name}\nAngle X: ${angleToCameraX.toFixed(0)}\nAngle Y: ${angleToCameraY.toFixed(0)}\nCamera angle: ${cameraRotationZ.toFixed(0)}\nRotation: ${rotationDegree.toFixed(0)}\nFrame: ${frameIndex.toFixed(0)}\nisMirror: ${isMirror}`
    } else {
        tireGroup.children[3].text = ""
    }

    // Update the display properties of the tire
    setSpriteFrame(tireGroup.children[0], frameIndex, isMirror, rotationDegree);
}

// Function to toggle rendering on debug shit
function toggleDebugShit() {
    enableDebugShit = !enableDebugShit

    // Axes
    kartGroup.children[0].children[1].visible = enableDebugShit // Kart
    kartGroup.children[1].children[2].visible = enableDebugShit // Tire #1
    kartGroup.children[2].children[2].visible = enableDebugShit // Tire #2
    kartGroup.children[3].children[2].visible = enableDebugShit // Tire #3
    kartGroup.children[4].children[2].visible = enableDebugShit // Tire #4

    // Wireframe box
    kartGroup.children[1].children[1].visible = enableDebugShit // Tire #1
    kartGroup.children[2].children[1].visible = enableDebugShit // Tire #2
    kartGroup.children[3].children[1].visible = enableDebugShit // Tire #3
    kartGroup.children[4].children[1].visible = enableDebugShit // Tire #4
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
    updateKartTireFrames()

    controls.update();
    stats.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start loop
initialize()
