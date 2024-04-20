import * as THREE from 'three';

export default class DefaultScene extends THREE.Scene {
    constructor() {
        super()
        this.background = new THREE.Color(0x1e1e1e)
        this.startPointPosition = new THREE.Vector3(0, 0, 0)
        this.startPointRotation = new THREE.Vector3(0, 0, 0)
        this.initialize()
    }

    initialize() {
        const gridHelper = new THREE.GridHelper(512, 32)
        this.scene.add(gridHelper)
    }
}