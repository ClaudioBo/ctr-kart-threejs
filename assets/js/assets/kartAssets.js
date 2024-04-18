import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

export default class KartAssets {
    constructor() {
        this.smokeTexture;
        this.tireTexture;
        this.kartModel;
        this.kartSounds;
        this.turboModels;
    }

    async loadAssets() {
        this.loadSmokeSpriteTexture()
        this.loadTireSpriteTexture()
        await this.loadKartModel()
        await this.loadKartSounds()
        await this.loadTurboModelFrames()
    }

    loadSmokeSpriteTexture() {
        const loadedSmokeTexture = new THREE.TextureLoader().load('assets/img/smoke-spritesheet.png');
        loadedSmokeTexture.magFilter = THREE.NearestFilter;
        loadedSmokeTexture.minFilter = THREE.NearestFilter;
        loadedSmokeTexture.colorSpace = THREE.SRGBColorSpace;
        this.smokeTexture = loadedSmokeTexture
    }

    loadTireSpriteTexture() {
        const tireSpriteTexture = new THREE.TextureLoader().load('assets/img/tire-spritesheet.png');
        tireSpriteTexture.magFilter = THREE.NearestFilter;
        tireSpriteTexture.minFilter = THREE.NearestFilter;
        tireSpriteTexture.colorSpace = THREE.SRGBColorSpace;
        this.tireTexture = tireSpriteTexture
    }

    async loadKartModel() {
        // Constants
        const materialPath = 'assets/models/crash/crash.mtl'
        const objectPath = 'assets/models/crash/crash.obj'

        // Load model and apply custom callback for the materials
        this.kartModel = await this.loadModel(materialPath, objectPath, material => {
            // Enable material vertex colors
            material.vertexColors = true
            // Disable texture filtering
            if (!!material.map) {
                material.map.magFilter = THREE.NearestFilter;
                material.map.minFilter = THREE.NearestFilter;
            }
        })
    }

    async loadKartSounds() {
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

        this.kartSounds = soundDict
    }

    async loadTurboModelFrames() {
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

        const arrayModels = []
        const materialPath = 'assets/models/turbo/turbo.mtl'
        for (let i = 0; i < TURBO_FRAME_NAMES.length; i++) {
            const turboName = TURBO_FRAME_NAMES[i];
            const objectPath = `assets/models/turbo/${turboName}.obj`
            const loadedModel = await this.loadModel(materialPath, objectPath, material => {
                if (!!material.map) {
                    material.map.magFilter = THREE.NearestFilter;
                    material.map.minFilter = THREE.NearestFilter;
                }
                material.blending = THREE.AdditiveBlending;
                material.side = THREE.DoubleSide
                material.transparent = true
                material.depthWrite = false
                material.vertexColors = true
            })
            loadedModel.name = `Turbo Frame: ${turboName}`
            arrayModels.push(loadedModel)
        }

        this.turboModels = arrayModels
    }

    async loadModel(materialPath, objectPath, materialCallback) {
        // Initialize loaders
        const mtlLoader = new MTLLoader();
        const objLoader = new OBJLoader();

        // Load the materials file
        const materials = await new Promise((resolve, reject) => {
            mtlLoader.load(materialPath, resolve);
        });

        // Preload materials
        materials.preload()

        // Set the materials to the object loader
        objLoader.setMaterials(materials);

        // Load the object file
        const model = await new Promise((resolve, reject) => {
            objLoader.load(objectPath, resolve);
        });

        // Loop through each material and apply modifications
        // traverse was needed because iterating with forEach didn't work haha
        if (materialCallback)
            model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => materialCallback(material));
                    }
                }
            });

        return model;
    }

}