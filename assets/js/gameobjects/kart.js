import * as THREE from 'three';

import Tires from './tires.js';
import Smoke from './smoke.js';
import TurboExhaust from './turboExhaust.js';

import { CustomTimer } from '../utils.js';
import { randInt } from 'three/src/math/MathUtils.js';

export default class Kart extends THREE.Group {
    constructor(main) {
        super()
        this.main = main

        // Constants
        this.KART_PROPERTIES = {
            VERTICAL_ROTATION_EXHAUST_OFFSET: 3.5,
            SMOKE_SPAWN_INTERVAL: 0.03 // Spawns each frame (1 / 30fps = 0.0333333333333333)
        }
        this.ACCELERATION_PROPERTIES = {
            ACCELERATION: 480, // 0x428, each frame it sums to currentSpeed
            DEACCELERATION: 130, // checked value frame by frame
            ACCELERATION_INCREMENT_INTERVAL: 0.03,
            // ACCELERATION_RESERVES: 1152, // 0x42A, idk
            SPEED_BASE: 13_140, // 0x42C, max speed without doing turbos
            SPEED_BASE_SINGLETURBO: 2048, // 0x430
            SPEED_EACH_TURBO: 512,
            SLIDECHARGE_INCREMENT: 32,
            SLIDECHARGE_INCREMENT_MS: 0.33,
            SLIDECHARGE_MIN_TURBO: 528,
            SLIDECHARGE_MAX_VALUE: 960,
            DETUNE_START: -1100,
            DETUNE_MODIFIER: 0.12
        }

        // Exhaust markers
        this.leftExhaustMarker
        this.rightExhaustMarker

        // Timers
        this.smokeSpawnTimer = new CustomTimer()
        this.speedLogicTimer = new CustomTimer()

        // Toggles
        this.isSmokeVisible = true
        this.isSmokeDark = false
        this.isTurboVisible = true

        // Runtime
        this.currentSmokes = []
        this.currentDetune = 0
        this.isAccelerating = false
        this.currentSpeed = 0
        this.targetSpeed = 0 // 0x39C, this is the max speed that it tries to reach
        this.currentSlideCharge = 0
        this.currentReserves = 0

        // Initialize
        this.initialize()
    }

    initialize() {
        this.calculateExhaustMarkers()
        this.addKartModel()
        this.addKartTires()
        this.addTurboExhaust()
        this.addSoundEmitters()
    }

    calculateExhaustMarkers() {
        this.leftExhaustMarker = new THREE.Object3D();
        this.rightExhaustMarker = new THREE.Object3D();
        this.leftExhaustMarker.position.set(0.2835, 0.715, -0.783)
        this.rightExhaustMarker.position.set(-0.2835, 0.715, -0.783)
        this.leftExhaustMarker.rotation.x = this.KART_PROPERTIES.VERTICAL_ROTATION_EXHAUST_OFFSET
        this.rightExhaustMarker.rotation.x = this.KART_PROPERTIES.VERTICAL_ROTATION_EXHAUST_OFFSET
    }

    addKartModel() {
        const kartModelCloned = this.main.assetsManager.kartAssets.kartModel.clone()
        kartModelCloned.name = "kartModel"
        this.add(kartModelCloned)
    }

    addKartTires() {
        this.add(new Tires(this.main, this))
    }

    addTurboExhaust() {
        this.add(new TurboExhaust(this.main, this.leftExhaustMarker, this.rightExhaustMarker))
    }

    addSoundEmitters() {
        const cameraAudioListener = this.main.camera.getObjectByName("audioListener")
        const engineEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineJetEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineFillingEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineHopEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineLandEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineSkidEmitter = new THREE.PositionalAudio(cameraAudioListener);

        const kartSounds = this.main.assetsManager.kartAssets.kartSounds

        engineEmitter.name = "kart_engine01"
        engineJetEmitter.name = "kart_enginejet"
        engineFillingEmitter.name = "kart_filling"
        engineHopEmitter.name = "kart_hop"
        engineLandEmitter.name = "kart_land"
        engineSkidEmitter.name = "kart_tire_skid"

        engineEmitter.setBuffer(kartSounds[engineEmitter.name])
        engineJetEmitter.setBuffer(kartSounds[engineJetEmitter.name])
        engineFillingEmitter.setBuffer(kartSounds[engineFillingEmitter.name])
        engineHopEmitter.setBuffer(kartSounds[engineHopEmitter.name])
        engineLandEmitter.setBuffer(kartSounds[engineLandEmitter.name])
        engineSkidEmitter.setBuffer(kartSounds[engineSkidEmitter.name])

        engineEmitter.setRefDistance(1)
        engineJetEmitter.setRefDistance(1)
        engineFillingEmitter.setRefDistance(1)
        engineHopEmitter.setRefDistance(1)
        engineLandEmitter.setRefDistance(1)
        engineSkidEmitter.setRefDistance(1)

        engineEmitter.setLoop(true);
        engineJetEmitter.setLoop(true);
        engineSkidEmitter.setLoop(true);

        this.add(engineEmitter)
        this.add(engineJetEmitter)
        this.add(engineFillingEmitter)
        this.add(engineHopEmitter)
        this.add(engineLandEmitter)
        this.add(engineSkidEmitter)
    }

    getKartModel() {
        return this.getObjectByName("kartModel")
    }

    getTurboExhaust() {
        return this.getObjectByName("turboExhausts")
    }

    doSmokeSpawning() {
        this.smokeSpawnTimer.update()
        if (this.smokeSpawnTimer.getElapsed() < this.KART_PROPERTIES.SMOKE_SPAWN_INTERVAL) return
        this.smokeSpawnTimer.resetAll()

        const leftExhaustPosition = this.leftExhaustMarker.getWorldPosition(new THREE.Vector3())
        const rightExhaustPosition = this.rightExhaustMarker.getWorldPosition(new THREE.Vector3())

        // Get kart's rotation relative to world
        const leftExhaustRotation = this.leftExhaustMarker.getWorldQuaternion(new THREE.Quaternion());
        const rightExhaustRotation = this.rightExhaustMarker.getWorldQuaternion(new THREE.Quaternion());

        // Clone the smokes
        const smokeLeft = new Smoke(this.main, this)
        const smokeRight = new Smoke(this.main, this)

        // Set position
        smokeLeft.position.copy(leftExhaustPosition)
        smokeRight.position.copy(rightExhaustPosition)

        // Set rotation
        smokeLeft.setRotationFromQuaternion(leftExhaustRotation);
        smokeRight.setRotationFromQuaternion(rightExhaustRotation);

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

        // Added to array to apply logic to it
        this.currentSmokes.push(smokeLeft)
        this.currentSmokes.push(smokeRight)

        // Add smokes to scene
        this.main.scene.add(smokeLeft)
        this.main.scene.add(smokeRight)
    }

    doSpeedLogic() {
        this.speedLogicTimer.update()
        if (this.speedLogicTimer.getElapsed() < this.ACCELERATION_PROPERTIES.ACCELERATION_INCREMENT_INTERVAL) return
        this.speedLogicTimer.resetAll()

        if (this.isAccelerating) {
            this.targetSpeed = this.ACCELERATION_PROPERTIES.SPEED_BASE
        } else {
            this.targetSpeed = 0
        }

        const newSpeed = this.isAccelerating ? this.ACCELERATION_PROPERTIES.ACCELERATION : -this.ACCELERATION_PROPERTIES.DEACCELERATION
        this.currentSpeed += newSpeed

        if (this.currentSpeed > this.ACCELERATION_PROPERTIES.SPEED_BASE) {
            this.currentSpeed = this.ACCELERATION_PROPERTIES.SPEED_BASE
        } else if (this.currentSpeed < 0) {
            this.currentSpeed = 0
        }
    }

    doKartSound() {
        const kartEngineEmitter = this.getObjectByName("kart_engine01")
        if (!this.main.isSoundEnabled) {
            if (kartEngineEmitter.isPlaying)
                kartEngineEmitter.stop()
        } else {
            if (!kartEngineEmitter.isPlaying)
                kartEngineEmitter.play()
        }
        this.currentDetune = this.ACCELERATION_PROPERTIES.DETUNE_START + (this.currentSpeed * this.ACCELERATION_PROPERTIES.DETUNE_MODIFIER)
        kartEngineEmitter.setDetune(this.currentDetune)
    }

    update(deltaTime) {
        // Tires
        this.getObjectByName("tires").update()

        // Turbo exhaust
        if (this.isTurboVisible) this.getObjectByName("turboExhausts").update()

        //Smoke
        this.currentSmokes.forEach(smoke => smoke.update())
        if (this.isSmokeVisible) this.doSmokeSpawning()

        // Speed logic
        this.doSpeedLogic()

        // Sound
        this.doKartSound()
    }

}