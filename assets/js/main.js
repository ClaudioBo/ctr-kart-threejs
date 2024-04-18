// Libraries
import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Managers
import AssetsManager from './managers/assetsManager.js';
import DebugManager from './managers/debugManager.js';

// Game Objects
import Kart from './gameobjects/kart.js';

export default class Main {
    constructor() {
        // Basic
        this.renderer;
        this.stats;
        this.scene;
        this.camera;
        this.cameraControls;
        this.clock;
        this.gui;

        // Managers
        this.assetsManager;
        this.debugManager

        // General Toggles
        this.isSoundEnabled = false

        // Game objects
        this.mainKart;
        this.gameObjects = [];
    }

    async initialize() {
        this.setupBasic()
        await this.setupManagers()
        this.registerListeners()

        this.addGameObjects()

        this.loop()
    }

    setupBasic() {
        this.setupRenderer()
        this.setupStats()
        this.setupClock()
        this.setupScene()
        this.setupCamera()
    }

    async setupManagers() {
        this.assetsManager = new AssetsManager()
        await this.assetsManager.loadAssets()

        this.debugManager = new DebugManager(this)
    }

    addGameObjects() {
        const kart = new Kart(this)
        this.mainKart = kart
        this.gameObjects.push(kart)
        this.scene.add(kart)
    }

    loop() {
        // Tiempo delta
        const deltaTime = this.clock.getDelta()

        // Actualizar logica
        this.cameraControls.update();
        this.stats.update();

        // Actualizar logica de GameObjects
        this.gameObjects.forEach(obj => obj.update(deltaTime))

        // Actualizar dibujos
        // ...

        // Renderizado y loopeo
        this.debugManager.update()
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.loop());
    }

    registerListeners() {
        window.addEventListener('resize', e => this.onWindowResize(e), false);
        document.addEventListener('keydown', e => this.onKeyDown(e), false);
        document.addEventListener('keyup', e => this.onKeyUp(e), false);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    setupStats() {
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    setupClock() {
        // Create clock
        this.clock = new THREE.Clock();
        this.clock.start()
    }

    setupScene() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e1e)

        // Add an ambient light to the scene for overall illumination
        // This light intensity matches the model hex colors
        // TODO: This light intensity shouldn't be too intense, makes other models too bright
        const ambientLight = new THREE.AmbientLight(0xffffff, 12.6);
        this.scene.add(ambientLight);
    }

    setupCamera() {
        // Setup PerspectiveCamera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.x = 0
        this.camera.position.y = 1.82 // 1.82q
        this.camera.position.z = -8.5 // -8.5
        this.camera.updateProjectionMatrix()

        // // Setup OrthographicCamera
        // this.camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
        // this.camera.position.x = 0
        // this.camera.position.y = 0
        // this.camera.position.z = -3
        // this.camera.zoom = 250
        // this.camera.updateProjectionMatrix()

        // Setup camera controls
        this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.cameraControls.enableDamping = true
        this.cameraControls.autoRotate = false

        // Setup camera listening
        const audioListener = new THREE.AudioListener();
        audioListener.name = "audioListener"
        this.camera.add(audioListener);
    }

    setupGUI() {
        this.gui = new GUI()
        this.gui.close()
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    onKeyDown(event) {
        if (event.key == "s") this.isSoundEnabled = !this.isSoundEnabled

        if (event.key == " ") this.mainKart.isAccelerating = true
    }

    onKeyUp(event) {
        if (event.key == " ") this.mainKart.isAccelerating = false
    }
}

new Main().initialize()