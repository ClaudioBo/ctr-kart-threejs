import * as THREE from 'three';

export default class SlideColiseumScene extends THREE.Scene {
    constructor(main) {
        super()
        this.main = main
        this.background = new THREE.Color(0xffb900)
        this.startPoint = new THREE.Vector3(0, 0, 0)
        this.addTrackModel()
        this.addTrackSky()
    }

    addTrackModel() {
        const trackModel = this.main.assetsManager.trackAssets.trackModel.clone()
        this.add(trackModel)
    }

    addTrackSky() {
        const trackSky = this.main.assetsManager.trackAssets.trackSky.clone()
        const scale = 50
        trackSky.scale.set(scale, scale, scale)
        this.add(trackSky)
    }
}