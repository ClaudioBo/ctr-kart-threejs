// Import Three.js
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

// Setup everything
const scene = new THREE.Scene();

// const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
// camera.position.x = 4;
// camera.position.y = 0;
// camera.position.z = 0;
// camera.zoom = 250
// camera.zoom = 500
// camera.updateProjectionMatrix()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 2
camera.position.y = 1.5

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
// This light intensity almost matches the model textures hex models without vertex coloring enabled
const ambientLight = new THREE.AmbientLight(0xffffff, 5);
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
                    // This fucks up some textures making them darker
                    material.vertexColors = true
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
    const mainKartGroup = kartModel.clone()
    const mainKartAxesHelper = new THREE.AxesHelper(1)
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
    wheelSprite.scale.set(0.5, 0.5, 1);

    // Debug wireframe
    const debugSquareMesh = new THREE.Mesh(debugSquareGeometry, debugSquareMaterial);

    // Debug text
    const textSprite = new SpriteText('#');
    textSprite.textHeight = 0.025
    textSprite.strokeColor = "black"
    textSprite.strokeWidth = 1

    // Axes just to position the wheels by eye lol
    const axesHelper = new THREE.AxesHelper(0.5)

    wheelGroup.add(wheelSprite)
    wheelGroup.add(debugSquareMesh)
    wheelGroup.add(textSprite)
    wheelGroup.add(axesHelper)

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
const wheelFramesPerColumn = 16;
const wheelFrameWidth = 32;
const wheelFrameHeight = 32;
const wheelTextureWidth = 512;
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
    const offsetX = 0.62;
    const offsetY = 0.25;
    const wheelLocalPositions = [
        new THREE.Vector3(-offsetX, offsetY, -0.40,),
        new THREE.Vector3(-offsetX, offsetY, 0.80,),
        new THREE.Vector3(offsetX, offsetY, -0.40,),
        new THREE.Vector3(offsetX, offsetY, 0.80,),
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
function easeInOut(t) {
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? 0.5 * Math.pow(2 * t, 2) : 0.5 * (2 - Math.pow(2 * (1 - t), 2));
}

// Helper functions for normalizing values
function normalize(initial_value, current_value, max_value) {
    return (current_value - initial_value) / (max_value - initial_value);
}

function changeWheelSpriteBasedOnCamera(wheelGroup) {
    // Calculate the angle between the camera's position and the wheel's position
    const relativePosition = wheelGroup.position.clone().sub(camera.position);
    const angleToCamera = Math.atan2(relativePosition.z, relativePosition.x) * (180 / Math.PI);

    // Frame selection, sprite rotation and mirroring
    let frameIndex;
    let rotationDegree = 0;
    let mirror = false;

    if (angleToCamera >= 0 && angleToCamera <= 90) {
        frameIndex = Math.floor((angleToCamera / 90) * wheelFramesPerColumn);
        mirror = true;
    } else if (angleToCamera > 90 && angleToCamera <= 180) {
        frameIndex = Math.floor(((180 - angleToCamera) / 90) * wheelFramesPerColumn);
        rotationDegree = 180;
        mirror = true;
    } else if (angleToCamera > -180 && angleToCamera <= -90) {
        frameIndex = Math.floor(((180 + angleToCamera) / 90) * wheelFramesPerColumn);
        rotationDegree = 180;
    } else if (angleToCamera > -90 && angleToCamera < 0) {
        frameIndex = Math.floor(((-angleToCamera) / 90) * wheelFramesPerColumn);
    }

    // TODO: Better interpolated sprite rotation
    const INTERPOLATION_START_ANGLE = 75;
    let factor = 0
    if (angleToCamera > INTERPOLATION_START_ANGLE && angleToCamera < 90) {
        factor = normalize(INTERPOLATION_START_ANGLE, angleToCamera, 90);
        rotationDegree = THREE.MathUtils.lerp(180, 0, easeInOut(1.0 - factor));
    } else if (angleToCamera > -90 && angleToCamera < -INTERPOLATION_START_ANGLE) {
        factor = normalize(-INTERPOLATION_START_ANGLE, angleToCamera, -90);
        rotationDegree = THREE.MathUtils.lerp(0, -180, easeInOut(factor));
    }

    // Debugging text
    wheelGroup.children[2].text = `Wheel #${wheelGroup.name}\nAngle: ${angleToCamera.toFixed(1)}\nFrame: ${frameIndex}\nRotation: ${rotationDegree.toFixed(2)}\nMirror: ${mirror}`

    // Update the frame for the current wheel
    setSpriteFrame(wheelGroup.children[0], frameIndex, mirror, rotationDegree);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true
controls.autoRotate = true

// Function to handle key presses
function onKeyDown(event) {
    if (event.key == "x")
        controls.autoRotate = !controls.autoRotate
    if (event.key == "c") {
        camera.position.set(0, 0, 2);
        controls.update();
    }
    if (event.key == " ")
        console.log(kartGroup.children[4].children[2].text.replaceAll("\n", ", "))
}
document.addEventListener('keydown', onKeyDown, false);

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
