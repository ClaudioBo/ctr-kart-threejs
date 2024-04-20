import * as THREE from 'three';
import { setSpriteFrame } from '../utils.js'

import { CustomTimer } from '../utils.js';

import { MathUtils, randFloat } from 'three/src/math/MathUtils.js';

export default class Smoke extends THREE.Group {
    constructor(main, kart) {
        super()

        this.main = main
        this.kart = kart
        this.sprite

        // Constants
        this.SMOKE_BASE_SCALE = this.kart.scaleKart;
        this.SMOKE_LIFETIME = 0.16; // Lifetime is 5 frames (5 / 30fps = 0.1666666666666667)
        this.SMOKE_SCALE_MIN = Math.abs(this.SMOKE_BASE_SCALE - 0.5);
        this.SMOKE_SCALE_MAX = Math.abs(this.SMOKE_BASE_SCALE - 1.0);
        this.SMOKE_MOVESPEED = 0.02;
        this.SMOKE_SPREAD = 0.5;
        this.SMOKE_OPACITY = 0.5;

        // Spritesheet properties
        this.SPRITESHEET_PROPERTIES = {
            totalFrames: 1,
            frameWidth: 32,
            frameHeight: 32,
            textureWidth: 32,
            textureHeight: 32,
        }

        // Properties
        this.timer = new CustomTimer();
        this.rotateSpeed = 0

        this.initialize()
    }

    addSprite() {
        const smokeMaterial = new THREE.SpriteMaterial({ map: this.main.assetsManager.kartAssets.smokeTexture.clone() });
        smokeMaterial.blending = this.kart.isSmokeDark ? THREE.SubtractiveBlending : THREE.AdditiveBlending
        smokeMaterial.depthWrite = false
        smokeMaterial.opacity = this.SMOKE_OPACITY

        const smokeSprite = new THREE.Sprite()
        smokeSprite.material = smokeMaterial

        setSpriteFrame(smokeSprite, this.SPRITESHEET_PROPERTIES, 0, false, 0)
        this.sprite = smokeSprite
        this.scale.set(0, 0, 0)
        this.add(smokeSprite)
    }

    initialize() {
        this.addSprite()
    }

    update() {
        // Timer
        this.timer.update()
        const timeElapsed = this.timer.getElapsed()

        // Lifetime
        if (timeElapsed > this.SMOKE_LIFETIME) {
            this.kart.currentSmokes.splice(this.kart.currentSmokes.indexOf(this), 1)
            this.main.scene.remove(this)
            return
        }

        // Forward vector with small random spread
        const forwardVector = new THREE.Vector3(randFloat(-this.SMOKE_SPREAD, this.SMOKE_SPREAD), 0, 1)

        // Move forward
        const directionVector = forwardVector.clone()
        directionVector.applyQuaternion(this.quaternion)
        directionVector.multiplyScalar(this.SMOKE_MOVESPEED)
        this.position.add(directionVector)

        // Rotation
        const CURRENT_SMOKE_ROTATION_DEGREE = this.sprite.material.rotation / (Math.PI / 180);
        const SMOKE_ROTATION_RATIO = -this.rotateSpeed
        const rotationDegree = SMOKE_ROTATION_RATIO + CURRENT_SMOKE_ROTATION_DEGREE

        // Lifetime ratio
        const SMOKE_LIFETIME_RATIO = (timeElapsed / this.SMOKE_LIFETIME)

        // Scale
        const SMOKE_SCALE_CURRENT = MathUtils.lerp(this.SMOKE_SCALE_MIN, this.SMOKE_SCALE_MAX, SMOKE_LIFETIME_RATIO)
        this.scale.set(SMOKE_SCALE_CURRENT, SMOKE_SCALE_CURRENT, 1);

        // Set frame and rotation
        setSpriteFrame(this.sprite, this.SPRITESHEET_PROPERTIES, 0, false, rotationDegree)
    }
}