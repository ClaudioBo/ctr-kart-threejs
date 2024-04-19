import * as THREE from 'three';

import { loadModel } from '../utils.js';

export default class TrackAssets {
    constructor() {
        this.trackSky;
        this.trackModel;
    }

    async loadAssets() {
        await this.loadTrackSky()
        await this.loadTrackModel()
    }

    async loadTrackSky() {
        const objectPath = 'assets/models/slideColiseum/data_sky.obj'

        this.trackSky = await loadModel(null, objectPath, false, material => {
            material.vertexColors = true
            if (!!material.map) {
                material.map.magFilter = THREE.NearestFilter;
                material.map.minFilter = THREE.NearestFilter;
            }
        })
    }

    async loadTrackModel() {
        const materialPath = 'assets/models/slideColiseum/data_Med.mtl'
        const objectPath = 'assets/models/slideColiseum/data_Med.obj'

        this.trackModel = await loadModel(materialPath, objectPath, true, material => {
            material.vertexColors = true
            if (!!material.map) {
                material.map.magFilter = THREE.NearestFilter;
                material.map.minFilter = THREE.NearestFilter;
            }
        })
    }

}