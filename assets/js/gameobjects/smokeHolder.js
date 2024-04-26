import * as THREE from 'three';
import { setSpriteFrame } from '../utils.js';

import { CustomTimer } from '../utils.js';

import { MathUtils, randFloat, randInt } from 'three/src/math/MathUtils.js';

export default class SmokeHolder extends THREE.Group {
    constructor(main, kart) {
        super()

        this.name = "smokeHolder"
        this.main = main
        this.kart = kart
        this.currentSmokes = []

        // Constants
        this.SMOKE_UP_ANGLE = 0.5
        this.SMOKE_SPAWN_INTERVAL = 0.03 // Spawns each frame (1 / 30fps = 0.0333333333333333)
        this.SMOKE_LIFETIME = 0.16; // Lifetime is 5 frames (5 / 30fps = 0.1666666666666667)
        this.SMOKE_SCALE_MIN = 0.5;
        this.SMOKE_SCALE_MAX = 1.0;
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

        // Runtime
        this.smokeSpawnTimer = new CustomTimer()
        this.isSmokeVisible = true
        this.isSmokeDark = false
    }

    createSprite() {
        const smokeMaterial = new THREE.SpriteMaterial({ map: this.main.assetsManager.kartAssets.smokeTexture.clone() });
        smokeMaterial.blending = this.kart.isSmokeDark ? THREE.SubtractiveBlending : THREE.AdditiveBlending
        smokeMaterial.depthWrite = false
        smokeMaterial.opacity = this.SMOKE_OPACITY

        const smokeSprite = new THREE.Sprite()
        smokeSprite.material = smokeMaterial

        setSpriteFrame(smokeSprite, this.SPRITESHEET_PROPERTIES, 0, false, 0)
        smokeSprite.scale.set(0, 0, 0)
        return smokeSprite
    }

    doSmokeSpawning() {
        this.smokeSpawnTimer.update()
        if (this.smokeSpawnTimer.getElapsed() < this.SMOKE_SPAWN_INTERVAL) return
        this.smokeSpawnTimer.resetAll()

        // Get positions
        const leftMarkerPosition = this.kart.KART_PROPERTIES.LEFT_EXHAUST_POSITION.clone()
        const rightMarkerPosition = this.kart.KART_PROPERTIES.RIGHT_EXHAUST_POSITION.clone()

        // Clone the smokes
        const smokeLeft = this.createSprite()
        const smokeRight = this.createSprite()

        // Set position
        smokeLeft.position.copy(leftMarkerPosition)
        smokeRight.position.copy(rightMarkerPosition)

        // TODO: New kart scaling and current rotation fucks up this, fix later
        // Offset the position a little bit up because smoke 1st frame is offset
        // and then a little bit far away from the exhaust bc its like that in the real game
        const OFFSET_VECTOR = new THREE.Vector3(0, 0.1, -0.05)
        smokeLeft.position.add(OFFSET_VECTOR)
        smokeRight.position.add(OFFSET_VECTOR)

        // Random speed value & 50% chance to invert the speed
        let randomSpeed = randInt(1, 2)
        if (Math.random() < 0.5) randomSpeed *= -1

        // Apply rotation to the smokes
        smokeLeft.rotateSpeed = randomSpeed
        smokeRight.rotateSpeed = randomSpeed

        // Create timers
        smokeLeft.timer = new CustomTimer();
        smokeRight.timer = new CustomTimer();

        // Added to array to apply logic to it
        this.currentSmokes.push(smokeLeft)
        this.currentSmokes.push(smokeRight)

        // Add smokes to scene
        this.add(smokeLeft)
        this.add(smokeRight)
    }

    update() {
        this.doSmokeSpawning()
        this.animateSmokes()
    }

    animateSmokes() {
        this.currentSmokes.forEach(sprite => {
            // Timer
            sprite.timer.update()
            const timeElapsed = sprite.timer.getElapsed()

            // Lifetime
            if (timeElapsed > this.SMOKE_LIFETIME) {
                this.currentSmokes.splice(this.currentSmokes.indexOf(sprite), 1)
                this.remove(sprite)
                return
            }

            // Forward vector with small random spread
            const forwardVector = new THREE.Vector3(randFloat(-this.SMOKE_SPREAD, this.SMOKE_SPREAD), this.SMOKE_UP_ANGLE, -1)
                .multiplyScalar(this.SMOKE_MOVESPEED)
            sprite.position.add(forwardVector)

            // Rotation
            const CURRENT_SMOKE_ROTATION_DEGREE = sprite.material.rotation / (Math.PI / 180);
            const SMOKE_ROTATION_RATIO = -sprite.rotateSpeed
            const rotationDegree = SMOKE_ROTATION_RATIO + CURRENT_SMOKE_ROTATION_DEGREE

            // Lifetime ratio
            const SMOKE_LIFETIME_RATIO = (timeElapsed / this.SMOKE_LIFETIME)

            // Scale
            const SMOKE_SCALE_CURRENT = MathUtils.lerp(this.SMOKE_SCALE_MIN, this.SMOKE_SCALE_MAX, SMOKE_LIFETIME_RATIO)
            sprite.scale.set(SMOKE_SCALE_CURRENT, SMOKE_SCALE_CURRENT, 1);

            // Set frame and rotation
            setSpriteFrame(sprite, this.SPRITESHEET_PROPERTIES, 0, false, rotationDegree)
        })
    }
}