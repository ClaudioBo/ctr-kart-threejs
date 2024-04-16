// Import Three.js
import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/addons/libs/stats.module.js';
import SpriteText from 'three-spritetext';
import { Timer } from 'three/addons/misc/Timer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { MathUtils, randFloat, randInt } from 'three/src/math/MathUtils.js';

// ThreeJS variables
let renderer;
let stats;
let ambientLight;
let gui;

// General variables
let clock;
let scene;
let camera;
let audioListener;
let controls;
let kartGroup;

// Constants
const VERTICAL_ROTATION_EXHAUST_OFFSET = 3.5 // 3.5, 3.715 or Math.PI

const TIRE_CONSTANTS = {
    TIRE_SCALE: 0.45, // by eye: 0.45, original short value 0xCCC (3276), converted to Float and multiplied by 0.1 = 0.45xxxx
    TIRE_POSITION_OFFSET_Y: 0.25,
    TIRE_POSITION_OFFSET_BACK_X: 0.575,
    TIRE_POSITION_OFFSET_FRONT_X: 0.575,
    TIRE_POSITION_OFFSET_BACK_Z: 0.4,
    TIRE_POSITION_OFFSET_FRONT_Z: 0.8,
    TIRE_FRAME_CHANGE_RATE: 3,
    TIRE_FRAME1_COLOR: new THREE.Color(0xffffff),
    TIRE_FRAME2_COLOR: new THREE.Color(0xbfbfbf),
}

const SMOKE_CONSTANTS = {
    SMOKE_SPAWN_INTERVAL: 0.03, // Spawns each frame (1 / 30fps = 0.0333333333333333)
    SMOKE_LIFETIME: 0.16, // Lifetime is 5 frames (5 / 30fps = 0.1666666666666667)
    SMOKE_SCALE_MIN: 0.5,
    SMOKE_SCALE_MAX: 1.0,
    SMOKE_MOVESPEED: 0.02,
    SMOKE_SPREAD: 0.5,
    SMOKE_OPACITY: 0.5,
    reset: () => gui.reset(),
}

const TURBO_CONSTANTS = {
    // Inspired on https://github.com/CTR-tools/CTR-ModSDK/blob/8d3c0c6eb262852a150fd50e2b5ad4335f363b15/mods/Modules/ReservesMeter/src/Turbo_Increment.c#L143
    TURBO_DISAPPEAR_AFTER_QUICKDEATH: 0.1, // Suggested on L#301
    TURBO_DISAPPEAR_AFTER_NORMALDEATH: 2.1, // 6/4 frames of 30fps
    TURBO_DISAPPEAR_AFTER_SLOWDEATH: 8.5, // 255 frames of 30fps?
    // Inspired on https://github.com/CTR-tools/CTR-ModSDK/blob/8d3c0c6eb262852a150fd50e2b5ad4335f363b15/include/namespace_Vehicle.h#L280
    TURBO_FIRE_SCALE_SMALL_RATIO: 0.25, // // One power-slide and green hang time is 5 (= 1 / 4)
    TURBO_FIRE_SCALE_MEDIUM_RATIO: 0.5, // Two power-slides and yellow hang time is 6 (= 2 / 4)
    TURBO_FIRE_SCALE_LARGE_RATIO: 0.75, // Three power-slides, red hang time, and start boost is 7 (= 3 / 4)
    TURBO_FIRE_SCALE_XLARGE_RATIO: 1, // Turbo pad and USF is 8 (= 4 / 4)
    reset: () => gui.reset(),
}

const ACCELERATION_PROPERTIES = {
    ACCELERATION: 480, // 0x428, each frame it sums to currentSpeed
    DEACCELERATION: 130, // checked value frame by frame
    ACCELERATION_INCREMENT_INTERVAL: 0.03,
    // ACCELERATION_RESERVES: 1152, // 0x42A, idk
    SPEED_BASE: 13_140, // 0x42C, max speed without doing turbos
    SPEED_BASE_SINGLETURBO: 2048, // 0x430

    SPEED_EACH_TURBO: 512,

    SLIDECHARGE_INCREMENT: 32,
    SLIDECHARGE_INCREMENT_MS: 0.33,
    SLIDECHARGE_MIN_TURBO: 528,
    SLIDECHARGE_MAX_VALUE: 960,

    DETUNE_START: -1100,
    DETUNE_MODIFIER: 0.12
}

// Preloaded stuff
let turboModelFrames = []
let turboTemplate
let kartModel;
let smokeSpriteTexture;
let kartSounds

// Last Intervals
let lastSmokeSpawn

// Properties - Speed
let isAccelerating = false
let currentSpeed = 0
let targetSpeed = 0 // 0x39C, this is the max speed that it tries to reach
let currentSlideCharge = 0
let currentReserves = 0

// Properties
let currentSmokes = []
let enableDebugShit = false
let isSoundEnabled = false // To be done
let isSmokeDark = false
let isSmokeVisible = true
let isTurboVisible = false

// Spritesheet properties
const tireSpritesheetProperties = {
    totalFrames: 17,
    frameWidth: 32,
    frameHeight: 32,
    textureWidth: 544,
    textureHeight: 32,
}
const smokeSpritesheetProperties = {
    totalFrames: 1,
    frameWidth: 32,
    frameHeight: 32,
    textureWidth: 32,
    textureHeight: 32,
}

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
    // TODO: This light intensity shouldn't be too intense, makes other models too bright
    ambientLight = new THREE.AmbientLight(0xffffff, 12.6);
    scene.add(ambientLight);

    // Setup camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = 0
    camera.position.y = 1.82 // 1.82q
    camera.position.z = -8.5 // -8.5
    camera.updateProjectionMatrix()

    // Setup camera listening
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    // camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
    // camera.position.x = 0
    // camera.position.y = 0
    // camera.position.z = -3
    // camera.zoom = 250
    // camera.updateProjectionMatrix()

    // Setup camera controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true
    controls.autoRotate = false

    // Create clock
    clock = new THREE.Clock();
    clock.start()

    // Load model and smoke
    kartModel = await loadKartModelOBJ();
    smokeSpriteTexture = loadSmokeSpriteTexture()
    turboModelFrames = await loadAllTurboModelFramesOBJ();
    turboTemplate = createTurboTemplate()
    kartSounds = await loadKartSounds()

    // Create kart group
    kartGroup = new THREE.Group()

    // Make the camera look at it
    controls.target = kartGroup.position.clone().add(new THREE.Vector3(0, 0.65, 0))

    // Create kart
    createKart()

    // Create 4 Kart's tires
    createKartTires()

    // Create kart positional audio emitter
    createKartSoundEmitters()

    // Add the Kart to the scene
    scene.add(kartGroup);

    // Setup GUI
    gui = new GUI()
    gui.close()
    setupGUI();

    // Register all listeners
    registerListeners();

    // Start loop
    render();
}

// Register all listeners
function registerListeners() {
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

function setupGUI() {
    const smokeProps = gui.addFolder('Smoke Properties');
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_SPAWN_INTERVAL").step(0.0001)
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_LIFETIME").step(0.0001)
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_SCALE_MIN").step(0.001)
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_SCALE_MAX").step(0.001)
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_MOVESPEED").step(0.00001)
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_SPREAD").step(0.001)
    smokeProps.add(SMOKE_CONSTANTS, "SMOKE_OPACITY").step(0.001)
    smokeProps.add(SMOKE_CONSTANTS, "reset")

    const turboProps = gui.addFolder('Turbo Properties');
    turboProps.add(TURBO_CONSTANTS, "TURBO_DISAPPEAR_AFTER_QUICKDEATH")
    turboProps.add(TURBO_CONSTANTS, "TURBO_DISAPPEAR_AFTER_SLOWDEATH")
    turboProps.add(TURBO_CONSTANTS, "TURBO_DISAPPEAR_AFTER_NORMALDEATH")
    turboProps.add(TURBO_CONSTANTS, "TURBO_FIRE_SCALE_SMALL_RATIO")
    turboProps.add(TURBO_CONSTANTS, "TURBO_FIRE_SCALE_MEDIUM_RATIO")
    turboProps.add(TURBO_CONSTANTS, "TURBO_FIRE_SCALE_LARGE_RATIO")
    turboProps.add(TURBO_CONSTANTS, "TURBO_FIRE_SCALE_XLARGE_RATIO")
    smokeProps.add(TURBO_CONSTANTS, "reset")
}

// Function to handle key presses
function onKeyDown(event) {
    if (event.key == "s") isSoundEnabled = !isSoundEnabled
    if (event.key == "w") toggleDebugShit()

    if (event.key == "z") {
        camera.position.x = 0
        camera.position.y = 1
        camera.position.z = -3
        camera.updateProjectionMatrix()
        controls.target = kartGroup.position.clone().add(new THREE.Vector3(0, 0.65, 0))
        controls.update();
    }
    if (event.key == "x") controls.autoRotate = !controls.autoRotate;

    if (event.key == "v") return
    if (event.key == "b") isSmokeDark = !isSmokeDark
    if (event.key == "n") isSmokeVisible = !isSmokeVisible

    if (event.key == " ") isAccelerating = true
}

function onKeyUp(event) {
    if (event.key == " ") isAccelerating = false
}

// Resize window function
function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

// Load kart model and materials
async function loadKartModelOBJ() {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    // Load the materials file
    const materials = await new Promise((resolve, reject) => {
        mtlLoader.load('assets/models/crash/crash.mtl', resolve);
    });

    // Preload materials
    materials.preload()

    // Set the materials to the object loader
    objLoader.setMaterials(materials);

    // Load the object file
    const object = await new Promise((resolve, reject) => {
        objLoader.load('assets/models/crash/crash.obj', resolve);
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

async function loadAllTurboModelFramesOBJ() {
    const TURBO_FRAME_NAMES = [
        "turbo0",
        "turbo1",
        "turbo2",
        "turbo3",
        "turbo4",
        "turbo5",
        "turbo6",
        "turbo7",
    ]

    const newArray = []
    for (let i = 0; i < TURBO_FRAME_NAMES.length; i++) {
        const name = TURBO_FRAME_NAMES[i];
        const loadedModel = await loadTurboModelFrameOBJ(name)
        newArray.push(loadedModel)
    }

    return newArray
}

async function loadTurboModelFrameOBJ(name) {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    // Load the materials file
    const materials = await new Promise((resolve, reject) => {
        mtlLoader.load('assets/models/turbo/turbo.mtl', resolve);
    });

    // Preload materials
    materials.preload()

    // Set the materials to the object loader
    objLoader.setMaterials(materials);

    // Load the object file
    const object = await new Promise((resolve, reject) => {
        objLoader.load(`assets/models/turbo/${name}.obj`, resolve);
    });

    // Loop through each material and apply modifications
    // traverse was needed because iterating with forEach didn't work haha
    object.traverse(child => {
        if (child instanceof THREE.Mesh) {
            if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                    if (!!material.map) {
                        material.map.magFilter = THREE.NearestFilter;
                        material.map.minFilter = THREE.NearestFilter;
                    }
                    material.blending = THREE.AdditiveBlending;
                    material.side = THREE.DoubleSide
                    material.transparent = true
                    material.depthWrite = false
                    material.vertexColors = true
                });
            }
        }
    });

    return object;
}

async function loadKartSounds() {
    const audioLoader = new THREE.AudioLoader();

    let soundDict = {
        "kart_engine01": undefined,
        "kart_enginejet": undefined,
        "kart_filling": undefined,
        "kart_hop": undefined,
        "kart_land": undefined,
        "kart_tire_skid": undefined,
    }

    await Promise.all(Object.keys(soundDict).map(async sndName => {
        soundDict[sndName] = await new Promise((resolve, reject) => {
            audioLoader.load(`assets/snd/${sndName}.mp3`, resolve);
        });
    }))

    return soundDict
}

function createTurboTemplate() {
    const turboGroup = new THREE.Group()

    let isFirstIteration = true
    turboModelFrames.forEach(tf => {
        if (!isFirstIteration) {
            tf.visible = false
        }
        isFirstIteration = false
        turboGroup.add(tf)
    })

    // Properties
    turboGroup.userData.currentFrame = 0
    return turboGroup
}

// Load smoke sprite
function loadSmokeSpriteTexture() {
    const smokeSpriteTexture = new THREE.TextureLoader().load('assets/img/smoke-spritesheet.png');
    smokeSpriteTexture.magFilter = THREE.NearestFilter;
    smokeSpriteTexture.minFilter = THREE.NearestFilter;
    smokeSpriteTexture.colorSpace = THREE.SRGBColorSpace;
    return smokeSpriteTexture
}

function createSmoke() {
    const smokeSpriteMaterial = new THREE.SpriteMaterial({ map: smokeSpriteTexture.clone() });
    smokeSpriteMaterial.blending = isSmokeDark ? THREE.SubtractiveBlending : THREE.AdditiveBlending
    smokeSpriteMaterial.depthWrite = false
    smokeSpriteMaterial.opacity = SMOKE_CONSTANTS.SMOKE_OPACITY

    const smokeSprite = new THREE.Sprite(smokeSpriteMaterial);
    setSpriteFrame(smokeSprite, smokeSpritesheetProperties, 0, false, 0)

    return smokeSprite
}

function nextTurboFrame(turboGroup) {
    const lastFrame = turboGroup.userData.currentFrame
    const lastFrameModel = turboGroup.children[lastFrame];
    turboGroup.userData.currentFrame += 1
    if (turboGroup.userData.currentFrame > turboGroup.children.length - 1) {
        turboGroup.userData.currentFrame = 0
        lastFrameModel.visible = false
    }
    const currentFrameModel = turboGroup.children[turboGroup.userData.currentFrame];
    lastFrameModel.visible = false
    currentFrameModel.visible = true
}

// Create Kart group
function createKart() {
    const mainKartGroup = kartModel.clone()
    const mainKartAxesHelper = new THREE.AxesHelper(1)
    mainKartAxesHelper.visible = false

    // Kart Exhausts markers
    const leftExhaustMarker = new THREE.Object3D();
    const rightExhaustMarker = new THREE.Object3D();
    leftExhaustMarker.position.set(0.2835, 0.715, -0.783)
    rightExhaustMarker.position.set(-0.2835, 0.715, -0.783)

    leftExhaustMarker.rotation.x = VERTICAL_ROTATION_EXHAUST_OFFSET
    rightExhaustMarker.rotation.x = VERTICAL_ROTATION_EXHAUST_OFFSET

    const leftExhaustModel = turboTemplate.clone()
    const rightExhaustModel = turboTemplate.clone()

    leftExhaustModel.visible = false
    rightExhaustModel.visible = false

    leftExhaustModel.position.copy(leftExhaustMarker.position)
    rightExhaustModel.position.copy(rightExhaustMarker.position)
    rightExhaustModel.scale.x = -1 // Mirror

    const turboAnimationTimer = new Timer()
    turboAnimationTimer.resetAll = () => {
        turboAnimationTimer._previousTime = 0;
        turboAnimationTimer._currentTime = 0;
        turboAnimationTimer._startTime = performance.now();
        turboAnimationTimer._delta = 0;
        turboAnimationTimer._elapsed = 0;
    }

    mainKartGroup.userData.turboAnimationTimer = turboAnimationTimer
    mainKartGroup.add(mainKartAxesHelper)
    mainKartGroup.add(leftExhaustMarker)
    mainKartGroup.add(rightExhaustMarker)
    mainKartGroup.add(leftExhaustModel)
    mainKartGroup.add(rightExhaustModel)

    // //debug arrows
    // const arrow1 = new THREE.ArrowHelper()
    // arrow1.position.copy(leftExhaustMarker.position)
    // arrow1.rotation.x = VERTICAL_ROTATION_EXHAUST_OFFSET
    // mainKartGroup.add(arrow1)

    // const arrow2 = new THREE.ArrowHelper()
    // arrow2.position.copy(rightExhaustMarker.position)
    // arrow2.rotation.x = VERTICAL_ROTATION_EXHAUST_OFFSET
    // mainKartGroup.add(arrow2)

    kartGroup.add(mainKartGroup);

}

// Create Tire group to clone later
function createTire() {
    // Tire group
    const tireGroup = new THREE.Group()

    // Debug square material
    const debugSquareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const debugSquareMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });

    // Tire texture
    const tireSpriteTexture = new THREE.TextureLoader().load('assets/img/tire-spritesheet.png');
    tireSpriteTexture.magFilter = THREE.NearestFilter;
    tireSpriteTexture.minFilter = THREE.NearestFilter;
    tireSpriteTexture.colorSpace = THREE.SRGBColorSpace;

    // Tire material
    const tireSpriteMaterial = new THREE.SpriteMaterial({ map: tireSpriteTexture });

    // Tire sprite
    const tireSprite = new THREE.Sprite(tireSpriteMaterial);
    tireSprite.scale.set(TIRE_CONSTANTS.TIRE_SCALE, TIRE_CONSTANTS.TIRE_SCALE, 1);

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
    setSpriteFrame(tireSprite, tireSpritesheetProperties, 0, false, 0)

    return tireGroup
}

// Create 4 Kart's tires
function createKartTires() {
    const tireLocalPositions = [
        new THREE.Vector3(-TIRE_CONSTANTS.TIRE_POSITION_OFFSET_BACK_X, TIRE_CONSTANTS.TIRE_POSITION_OFFSET_Y, -TIRE_CONSTANTS.TIRE_POSITION_OFFSET_BACK_Z,), // Back right
        new THREE.Vector3(-TIRE_CONSTANTS.TIRE_POSITION_OFFSET_FRONT_X, TIRE_CONSTANTS.TIRE_POSITION_OFFSET_Y, TIRE_CONSTANTS.TIRE_POSITION_OFFSET_FRONT_Z,), // Front right
        new THREE.Vector3(TIRE_CONSTANTS.TIRE_POSITION_OFFSET_BACK_X, TIRE_CONSTANTS.TIRE_POSITION_OFFSET_Y, -TIRE_CONSTANTS.TIRE_POSITION_OFFSET_BACK_Z,), // Back left
        new THREE.Vector3(TIRE_CONSTANTS.TIRE_POSITION_OFFSET_FRONT_X, TIRE_CONSTANTS.TIRE_POSITION_OFFSET_Y, TIRE_CONSTANTS.TIRE_POSITION_OFFSET_FRONT_Z,), // Front left
    ];
    for (let i = 0; i < 4; i++) {
        const tireNew = createTire()
        tireNew.position.copy(tireLocalPositions[i])
        tireNew.name = i
        kartGroup.add(tireNew)
    }
}

function createKartSoundEmitters() {
    const engineEmitter = new THREE.PositionalAudio(audioListener);
    const engineJetEmitter = new THREE.PositionalAudio(audioListener);
    const engineFillingEmitter = new THREE.PositionalAudio(audioListener);
    const engineHopEmitter = new THREE.PositionalAudio(audioListener);
    const engineLandEmitter = new THREE.PositionalAudio(audioListener);
    const engineSkidEmitter = new THREE.PositionalAudio(audioListener);

    engineEmitter.setBuffer(kartSounds["kart_engine01"])
    engineJetEmitter.setBuffer(kartSounds["kart_enginejet"])
    engineFillingEmitter.setBuffer(kartSounds["kart_filling"])
    engineHopEmitter.setBuffer(kartSounds["kart_hop"])
    engineLandEmitter.setBuffer(kartSounds["kart_land"])
    engineSkidEmitter.setBuffer(kartSounds["kart_tire_skid"])

    engineEmitter.setRefDistance(1)
    engineJetEmitter.setRefDistance(1)
    engineFillingEmitter.setRefDistance(1)
    engineHopEmitter.setRefDistance(1)
    engineLandEmitter.setRefDistance(1)
    engineSkidEmitter.setRefDistance(1)

    engineEmitter.setLoop(true);
    engineJetEmitter.setLoop(true);
    engineSkidEmitter.setLoop(true);

    kartGroup.add(engineEmitter)
    kartGroup.add(engineJetEmitter)
    kartGroup.add(engineFillingEmitter)
    kartGroup.add(engineHopEmitter)
    kartGroup.add(engineLandEmitter)
    kartGroup.add(engineSkidEmitter)
}

// Function to set sprite frame, mirroring and rotation
function setSpriteFrame(sprite, spritesheetProperties, frameIndex, mirror = false, rotationDegree = 0) {
    const totalFrames = spritesheetProperties.totalFrames
    const frameWidth = spritesheetProperties.frameWidth
    const frameHeight = spritesheetProperties.frameHeight
    const textureWidth = spritesheetProperties.textureWidth
    const textureHeight = spritesheetProperties.textureHeight

    const x = (frameIndex % totalFrames) * frameWidth;
    const y = Math.floor(frameIndex / totalFrames) * frameHeight;

    // Calculate texture offsets and repeats
    const offsetX = x / textureWidth;
    const offsetY = 1 - (y + frameHeight) / textureHeight;
    const repeatX = frameWidth / textureWidth;
    const repeatY = frameHeight / textureHeight;

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

// Functions to update the frame for each tire based on the camera's view
function updateKartTireFrames() {
    for (let i = 1; i <= 4; i++) {
        const tireGroup = kartGroup.children[i];
        changeTireSpriteBasedOnCamera(tireGroup)
    }
}

// Helper function to reverse a number from a range
function reverseNumber(startValue, currentValue, maxValue) {
    return startValue + (maxValue - startValue + 1) - (currentValue - startValue + 1);
}

// Helper function to normalize a value to maxValue
function normalizeToMax(currentValue, maxValue) {
    return currentValue / maxValue;
}

// Helper function to normalize/scale a value to scaleMax
function scaleValue(currentValue, scaleMax, originalMax) {
    return (currentValue * scaleMax) / originalMax;
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

    // Apply the inverse of tireGroup's rotation to the relative position vector
    const inverseRotation = tireGroupWorldRotation.clone().conjugate();
    relativePosition.applyQuaternion(inverseRotation);

    // Calculate the angle in degrees to the camera on the X-Z plane
    const angleToCameraX = Math.atan2(relativePosition.z, relativePosition.x) * (180 / Math.PI);

    // Calculate the angle in degrees to the camera on the Y-Z plane
    const angleToCameraY = Math.atan2(relativePosition.y, Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z)) * (180 / Math.PI);

    // Get the relative rotation of the camera
    const relativeCameraRotation = new THREE.Quaternion();
    relativeCameraRotation.copy(camera.quaternion).premultiply(tireGroupWorldRotation.clone().conjugate());

    // Convert the relative rotation to Euler angles
    const relativeCameraEuler = new THREE.Euler().setFromQuaternion(relativeCameraRotation);

    // Convert the relative rotation to degrees
    const relativeCameraRotationZDegrees = THREE.MathUtils.radToDeg(relativeCameraEuler.z);

    // Sum variables
    const tireTotalFrames = tireSpritesheetProperties.totalFrames
    let frameIndex = 0
    let isMirror = false

    // Very promising and simpler sprite rotation method...
    let rotationDegree = 180 - relativeCameraRotationZDegrees;

    // I'll get the closest step value to make the rotations more choppy on purpose
    // Kinda matching the low frames of the spritesheet, or make the rotations less noticeable
    rotationDegree = closestStepValue(rotationDegree, tireTotalFrames / 2)

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
        tireGroup.children[3].text = `Tire #${tireGroup.name}\nAngle X: ${angleToCameraX.toFixed(0)}\nAngle Y: ${angleToCameraY.toFixed(0)}\nCamera Rotation Z: ${relativeCameraRotationZDegrees.toFixed(0)}\nRotation: ${rotationDegree.toFixed(0)}\nFrame: ${frameIndex.toFixed(0)}\nisMirror: ${isMirror}`
    } else {
        tireGroup.children[3].text = ""
    }

    // Update the display properties of the tire
    setSpriteFrame(tireGroup.children[0], tireSpritesheetProperties, frameIndex, isMirror, rotationDegree);
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
}

let lastTireColorChange = 0
function changeTireColor(elapsedClock) {
    const tire1 = kartGroup.children[1].children[0].material
    const tire2 = kartGroup.children[2].children[0].material
    const tire3 = kartGroup.children[3].children[0].material
    const tire4 = kartGroup.children[4].children[0].material

    const baseFrameDuration = TIRE_CONSTANTS.TIRE_FRAME_CHANGE_RATE;
    const frameDuration = baseFrameDuration / (currentSpeed / ACCELERATION_PROPERTIES.SPEED_BASE);

    const currentTimeMS = elapsedClock * 1000;
    const selectedFrame = Math.floor(currentTimeMS / frameDuration) % 2 === 0 ? TIRE_CONSTANTS.TIRE_FRAME1_COLOR : TIRE_CONSTANTS.TIRE_FRAME2_COLOR;

    tire1.color = selectedFrame
    tire2.color = selectedFrame
    tire3.color = selectedFrame
    tire4.color = selectedFrame
}

function writeDebugText() {
    const lines = [
        `isSoundEnabled (S): ${isSoundEnabled}`,
        `isAccelerating (Space): ${isAccelerating}`,
        `currentSpeed: ${currentSpeed}`,
        `targetSpeed: ${targetSpeed}`,
        // `currentSlideCharge: ${currentSlideCharge}`,
        // `currentReserves: ${currentReserves}`,
        ``,
        `<a href="https://github.com/ClaudioBo/ctr-kart-threejs">Github</a>`,
    ]

    const output = lines.join("<br>")
    document.getElementById("debugText").innerHTML = output
}

// Loop function
function render() {
    update()

    updateKartTireFrames()

    controls.update();
    stats.update();

    writeDebugText()

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function update() {
    const deltaTime = clock.getDelta()
    const elapsedClock = clock.getElapsedTime();

    doSpeedLogic(elapsedClock)
    changeTireColor(elapsedClock)
    doKartSound(elapsedClock)

    trySmokeSpawning(elapsedClock)
    doSmokeLogic()
    doTurboAnimation()
    // doRotationDebugLogic(deltaTime)
}

let lastSpeedLogicTime = 0

function doSpeedLogic(elapsedClock) {
    if (elapsedClock - lastSpeedLogicTime < ACCELERATION_PROPERTIES.ACCELERATION_INCREMENT_INTERVAL) return
    lastSpeedLogicTime = elapsedClock

    if (isAccelerating) {
        targetSpeed = ACCELERATION_PROPERTIES.SPEED_BASE
    } else {
        targetSpeed = 0
    }

    const newSpeed = isAccelerating ? ACCELERATION_PROPERTIES.ACCELERATION : -ACCELERATION_PROPERTIES.DEACCELERATION
    currentSpeed += newSpeed

    if (currentSpeed > ACCELERATION_PROPERTIES.SPEED_BASE) {
        currentSpeed = ACCELERATION_PROPERTIES.SPEED_BASE
    } else if (currentSpeed < 0) {
        currentSpeed = 0
    }
}

let currentDetune = 0
function doKartSound(elapsedClock) {
    const kartEngineEmitter = kartGroup.children[5]
    if (!isSoundEnabled) {
        if (kartEngineEmitter.isPlaying)
            kartEngineEmitter.stop()
    } else {
        if (!kartEngineEmitter.isPlaying)
            kartEngineEmitter.play()
    }
    currentDetune = ACCELERATION_PROPERTIES.DETUNE_START + (currentSpeed * ACCELERATION_PROPERTIES.DETUNE_MODIFIER)
    kartEngineEmitter.setDetune(currentDetune)
}

function doSmokeLogic() {
    currentSmokes.forEach(smoke => {
        // Timer
        smoke.timer.update()
        const timeElapsed = smoke.timer.getElapsed()

        // Forward vector with small random spread
        const forwardVector = new THREE.Vector3(randFloat(-SMOKE_CONSTANTS.SMOKE_SPREAD, SMOKE_CONSTANTS.SMOKE_SPREAD), 0, 1)

        // Lifetime
        if (timeElapsed > SMOKE_CONSTANTS.SMOKE_LIFETIME) {
            currentSmokes.splice(currentSmokes.indexOf(smoke), 1)
            scene.remove(smoke)
            return
        }

        // Move forward
        const directionVector = forwardVector.clone()
        directionVector.applyQuaternion(smoke.quaternion)
        directionVector.multiplyScalar(SMOKE_CONSTANTS.SMOKE_MOVESPEED)
        smoke.position.add(directionVector)

        // Rotation
        const CURRENT_SMOKE_ROTATION_DEGREE = smoke.material.rotation / (Math.PI / 180);
        const SMOKE_ROTATION_RATIO = -smoke.rotateSpeed
        const rotationDegree = SMOKE_ROTATION_RATIO + CURRENT_SMOKE_ROTATION_DEGREE

        // Lifetime ratio
        const SMOKE_LIFETIME_RATIO = (timeElapsed / SMOKE_CONSTANTS.SMOKE_LIFETIME)

        // // Opacity
        // smoke.material.opacity = reverseNumber(0, SMOKE_TEST.SMOKE_LIFETIME_RATIO, 1)

        // Scale
        const SMOKE_SCALE_CURRENT = MathUtils.lerp(SMOKE_CONSTANTS.SMOKE_SCALE_MIN, SMOKE_CONSTANTS.SMOKE_SCALE_MAX, SMOKE_LIFETIME_RATIO)
        smoke.scale.set(SMOKE_SCALE_CURRENT, SMOKE_SCALE_CURRENT, 1);

        // Set frame and rotation
        setSpriteFrame(smoke, smokeSpritesheetProperties, 0, false, rotationDegree)

    })
}

function toggleTurboVisibility() {
    isTurboVisible = !isTurboVisible
    kartGroup.children[0].children[4].visible = isTurboVisible
    kartGroup.children[0].children[5].visible = isTurboVisible
}

function doTurboAnimation() {
    const turboAnimationTimer = kartGroup.children[0].userData.turboAnimationTimer
    turboAnimationTimer.update()

    const TURBO_ANIMATION_SPEED = 0.03
    const elapsedTime = turboAnimationTimer.getElapsed()
    if (elapsedTime < TURBO_ANIMATION_SPEED) return

    turboAnimationTimer.resetAll()

    nextTurboFrame(kartGroup.children[0].children[4])
    nextTurboFrame(kartGroup.children[0].children[5])
}

function trySmokeSpawning(elapsedClock) {
    if (!isSmokeVisible) return
    if (elapsedClock - lastSmokeSpawn < SMOKE_CONSTANTS.SMOKE_SPAWN_INTERVAL) return

    // Get marker positions and rotations relative to world
    const leftExhaustMarker = kartGroup.children[0].children[2]
    const rightExhaustMarker = kartGroup.children[0].children[3]

    const leftExhaustPosition = leftExhaustMarker.getWorldPosition(new THREE.Vector3())
    const rightExhaustPosition = rightExhaustMarker.getWorldPosition(new THREE.Vector3())

    // Get kart's rotation relative to world
    const leftExhaustRotation = leftExhaustMarker.getWorldQuaternion(new THREE.Quaternion());
    const rightExhaustRotation = rightExhaustMarker.getWorldQuaternion(new THREE.Quaternion());

    // Clone the smokes
    const smokeLeft = createSmoke()
    const smokeRight = createSmoke()

    // Set position
    smokeLeft.position.copy(leftExhaustPosition)
    smokeRight.position.copy(rightExhaustPosition)

    // Set rotation
    smokeLeft.setRotationFromQuaternion(leftExhaustRotation);
    smokeRight.setRotationFromQuaternion(rightExhaustRotation);

    // Offset the position a little bit up because smoke 1st frame is offset
    // and then a little bit far away from the exhaust bc its like that in the real game
    const OFFSET_VECTOR = new THREE.Vector3(0, 0.1, -0.05)
    smokeLeft.position.add(OFFSET_VECTOR)
    smokeRight.position.add(OFFSET_VECTOR)

    // Set some properties for logic
    smokeLeft.timer = new Timer();
    smokeRight.timer = new Timer();

    // Random speed value & 50% chance to invert the speed
    let randomSpeed = randInt(1, 2)
    if (Math.random() < 0.5) randomSpeed *= -1

    // Apply rotation to the smokes
    smokeLeft.rotateSpeed = randomSpeed
    smokeRight.rotateSpeed = randomSpeed

    // Added to array to apply logic to it
    currentSmokes.push(smokeLeft)
    currentSmokes.push(smokeRight)

    // Add smokes to scene
    scene.add(smokeLeft)
    scene.add(smokeRight)

    // Update
    lastSmokeSpawn = elapsedClock
}

function doRotationDebugLogic(deltaTime) {
    const rotationSpeed = 0.5 * deltaTime
    kartGroup.rotation.x += rotationSpeed
    kartGroup.rotation.y += rotationSpeed
}

// Start loop
initialize()
