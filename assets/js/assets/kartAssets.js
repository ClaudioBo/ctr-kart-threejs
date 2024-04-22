import * as THREE from 'three';

import { loadModel } from '../utils.js';

export default class KartAssets {
    constructor() {
        this.shadowTexture;
        this.smokeTexture;
        this.tireTexture;
        this.kartModel;
        this.kartSounds;
        this.turboModels;
    }

    async loadAssets() {
        this.loadKartShadowTexture()
        this.loadSmokeSpriteTexture()
        this.loadTireSpriteTexture()
        await this.loadKartModel()
        await this.loadKartSounds()
        await this.loadTurboModelFrames()
    }

    loadKartShadowTexture() {
        const loadedShadowTexture = new THREE.TextureLoader().load('assets/img/kart-shadow.png');
        loadedShadowTexture.magFilter = THREE.NearestFilter;
        loadedShadowTexture.minFilter = THREE.NearestFilter;
        loadedShadowTexture.colorSpace = THREE.SRGBColorSpace;
        this.shadowTexture = loadedShadowTexture
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
        const materialPath = 'assets/models/crash/crash.mtl'
        const objectPath = 'assets/models/crash/crash.obj'

        this.kartModel = await loadModel(materialPath, objectPath, 2, material => {
            material.vertexColors = true
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
            const loadedModel = await loadModel(materialPath, objectPath, 2, material => {
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

}