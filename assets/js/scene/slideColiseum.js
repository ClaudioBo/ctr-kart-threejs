import RAPIER from '@dimforge/rapier3d';
import * as THREE from 'three';
import { addGeometryToPhysics } from '../utils.js';

export default class SlideColiseumScene extends THREE.Scene {
    constructor(main) {
        super()
        this.main = main

        // Background
        this.background = new THREE.Color(0xf9b755)
        // this.background = new THREE.Color(0x65a40f)

        // Start Position
        this.startPointPosition = new THREE.Vector3(16.5, 5, -108.55)
        this.startPointRotation = new THREE.Vector3(0, Math.PI / -2, 0)

        // Physics
        this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })
        this.groundRigidBody
        this.wallsRigidBody
        this.dirtRigidBody

        // Initialize
        this.addTrackModel()
        this.addTrackSky()
    }

    addTrackModel() {
        const trackModel = this.main.assetsManager.trackAssets.trackModel.clone()
        this.add(trackModel)

        const trackGround = this.main.assetsManager.trackAssets.trackGround.clone()
        const trackWalls = this.main.assetsManager.trackAssets.trackWalls.clone()
        const trackDirt = this.main.assetsManager.trackAssets.trackDirt.clone()

        this.groundRigidBody = addGeometryToPhysics(this.world, RAPIER.RigidBodyDesc.fixed(), trackGround)
        this.wallsRigidBody = addGeometryToPhysics(this.world, RAPIER.RigidBodyDesc.fixed(), trackWalls)
        this.dirtRigidBody = addGeometryToPhysics(this.world, RAPIER.RigidBodyDesc.fixed(), trackDirt)
    }

    addTrackSky() {
        const trackSky = this.main.assetsManager.trackAssets.trackSky.clone()
        const scale = 50
        trackSky.scale.set(scale, scale, scale)
        this.add(trackSky)
    }
}