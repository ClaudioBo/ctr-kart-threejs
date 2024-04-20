import * as THREE from 'three';

export default class SlideColiseumScene extends THREE.Scene {
    constructor(main) {
        super()
        this.main = main
        this.background = new THREE.Color(0xca9443)
        // this.background = new THREE.Color(0x64a30f)
        this.startPointPosition = new THREE.Vector3(14.8, 0, -108.65)
        // this.startPointPosition = new THREE.Vector3(17, 0, -105)
        this.startPointRotation = new THREE.Vector3(0, Math.PI / -2, 0)
        this.addTrackModel()
        this.addTrackSky()
    }

    addTrackModel() {
        const trackModel = this.main.assetsManager.trackAssets.trackModel.clone()
        this.add(trackModel)

        const trackGround = this.main.assetsManager.trackAssets.trackGround.clone()
        const trackWalls = this.main.assetsManager.trackAssets.trackWalls.clone()
        const trackDirt = this.main.assetsManager.trackAssets.trackDirt.clone()

        trackGround.visible = false
        trackWalls.visible = false
        trackDirt.visible = false

        this.add(trackGround)
        this.add(trackWalls)
        this.add(trackDirt)
    }

    // // Testing
    // const trackGround = this.main.assetsManager.trackAssets.trackGround.clone()
    // const trackWalls = this.main.assetsManager.trackAssets.trackWalls.clone()
    // const trackDirt = this.main.assetsManager.trackAssets.trackDirt.clone()
    // const callbackTest = (child, color) => {
    //     if (child instanceof THREE.Mesh) {
    //         child.material.color = color
    //     }
    // }
    // trackGround.traverse(child => callbackTest(child, new THREE.Color(0x1e1e1e)))
    // trackWalls.traverse(child => callbackTest(child, new THREE.Color(0x3c3835)))
    // trackDirt.traverse(child => callbackTest(child, new THREE.Color(0x005500)))
    // this.add(trackGround)
    // this.add(trackWalls)
    // this.add(trackDirt)

    addTrackSky() {
        const trackSky = this.main.assetsManager.trackAssets.trackSky.clone()
        const scale = 50
        trackSky.scale.set(scale, scale, scale)
        this.add(trackSky)
    }
}