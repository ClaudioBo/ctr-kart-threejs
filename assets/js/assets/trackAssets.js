import * as THREE from 'three';

import { loadModel } from '../utils.js';

export default class TrackAssets {
    constructor() {
        this.trackSky;
        this.trackModel;
        this.trackGround;
        this.trackWalls;
        this.trackDirt;
    }

    async loadAssets() {
        await this.loadTrackSky()
        await this.loadTrackModel()
        await this.loadTrackPhysics()
        this.hideBotPaths()
    }

    hideBotPaths() {
        [
            this.trackModel
        ]
            .forEach(track => {
                const botPathEasy = track.getObjectByName("BotPath_Easy")
                const botPathMedium = track.getObjectByName("BotPath_Medium")
                const botPathHard = track.getObjectByName("BotPath_Hard")
                if (botPathEasy) botPathEasy.visible = false
                if (botPathMedium) botPathMedium.visible = false
                if (botPathHard) botPathHard.visible = false
            })
    }

    async loadTrackSky() {
        const objectPath = 'assets/models/tracks/slideColiseum/data_sky.obj'

        this.trackSky = await loadModel(null, objectPath, 1, material => {
            material.vertexColors = true
            if (!!material.map) {
                material.map.magFilter = THREE.NearestFilter;
                material.map.minFilter = THREE.NearestFilter;
            }
        })
    }

    async loadTrackModel() {
        const materialPath = 'assets/models/tracks/slideColiseum/data_Med.mtl'
        const objectPath = 'assets/models/tracks/slideColiseum/data_Med.obj'

        this.trackModel = await loadModel(materialPath, objectPath, 2, material => {
            material.vertexColors = true
            if (!!material.map) {
                material.map.magFilter = THREE.NearestFilter;
                material.map.minFilter = THREE.NearestFilter;
            }
        }, 2.55994)
    }

    async loadTrackPhysics() {
        const objectFolder = 'assets/models/tracks/slideColiseum'
        this.trackGround = await loadModel(null, `${objectFolder}/ground.obj`, undefined, () => { }, 2.55994)
        this.trackWalls = await loadModel(null, `${objectFolder}/walls.obj`, undefined, () => { }, 2.55994)
        this.trackDirt = await loadModel(null, `${objectFolder}/dirt.obj`, undefined, () => { }, 2.55994)
        this.trackGround.name = "ground"
        this.trackWalls.name = "walls"
        this.trackDirt.name = "dirt"
    }

}