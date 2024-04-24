// Libraries
import * as RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import GUI from 'lil-gui';
import Stats from 'three/addons/libs/stats.module.js';

// Utils
import RapierDebugRenderer from './rapierDebug.js';
import { CustomTimer } from './utils.js';

// Managers
import AssetsManager from './managers/assetsManager.js';
import DebugManager from './managers/debugManager.js';

// Game Objects
import GameCamera from './gameobjects/gameCamera.js';
import Kart from './gameobjects/kart.js';
import SlideColiseumScene from './scene/slideColiseum.js';

export default class Main {
    constructor() {
        // Basic
        this.renderer;
        this.rapier
        this.stats;
        this.scene;
        this.timer;
        this.gui;
        this.rapierDebugRenderer

        // Managers
        this.assetsManager;
        this.debugManager

        // General Toggles
        this.isSoundEnabled = false

        // Game objects
        this.gameCamera;
        this.mainKart;
        this.gameObjects = [];
    }

    async initialize() {
        this.setupBasic()
        this.setupGUI()
        await this.setupManagers()
        this.setupScene()
        this.registerListeners()
        this.addGameObjects()
        this.debugManager.addToGUI()

        this.rapierDebugRenderer = new RapierDebugRenderer(this.scene, this.scene.world)

        this.loop()
    }

    setupBasic() {
        this.setupRenderer()
        this.setupStats()
        this.setupTimer()
    }

    async setupManagers() {
        this.assetsManager = new AssetsManager()
        await this.assetsManager.loadAssets()

        this.debugManager = new DebugManager(this)
    }

    addGameObjects() {
        this.setupGameCamera()

        // Test add Kart object
        const kart = new Kart(this)
        kart.position.add(this.scene.startPointPosition)
        kart.rotation.y = this.scene.startPointAngle
        kart.initializePhysics()
        this.mainKart = kart

        this.gameCamera.followPlayer(this.mainKart)
        this.gameObjects.push(kart)
        this.scene.add(kart)
    }

    loop() {
        // Tiempo delta
        this.timer.update()
        let deltaTime = this.timer.getDelta()

        // Actualizar fisicas
        this.scene.world.step()

        // Actualizar logica de GameObjects
        this.gameObjects.forEach(obj => obj.update(deltaTime))
        this.gameCamera.update(deltaTime)

        // Renderizado y loopeo
        this.rapierDebugRenderer.update()
        this.stats.update();
        this.debugManager.update()
        this.renderer.render(this.scene, this.gameCamera);
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

    setupTimer() {
        // Create timer
        this.timer = new CustomTimer();
    }

    setupScene() {
        // Setup scene
        // this.scene = new DefaultScene();
        this.scene = new SlideColiseumScene(this);

        // Add an ambient light to the scene for overall illumination
        // This light intensity matches the model hex colors
        // TODO: This light intensity shouldn't be too intense, makes other models too bright
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);
    }

    setupGameCamera() {
        this.gameCamera = new GameCamera(this, 70, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    setupGUI() {
        this.gui = new GUI()
        this.gui.close()
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.gameCamera.aspect = window.innerWidth / window.innerHeight;
        this.gameCamera.updateProjectionMatrix();
    }

    onKeyDown(event) {
        const keyPressed = event.key.toLowerCase()
        this.debugManager.handleKeyDown(keyPressed)
        this.mainKart.handleKeyDown(keyPressed)
        this.gameCamera.handleKeyDown(keyPressed)
        if (keyPressed == "s") this.isSoundEnabled = !this.isSoundEnabled
    }

    onKeyUp(event) {
        const keyReleased = event.key.toLowerCase()
        this.mainKart.handleKeyUp(keyReleased)
        this.gameCamera.handleKeyUp(keyReleased)
    }
}

await RAPIER.init()
new Main().initialize()