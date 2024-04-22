import * as THREE from 'three';

import Smoke from './smoke.js';
import Tires from './tires.js';
import TurboExhaust from './turboExhaust.js';

import { degToRad, randInt } from 'three/src/math/MathUtils.js';
import { CustomTimer } from '../utils.js';
import RAPIER from '@dimforge/rapier3d';

export default class Kart extends THREE.Group {
    constructor(main) {
        super()
        this.main = main

        // Constants
        this.KART_PROPERTIES = {
            VERTICAL_ROTATION_EXHAUST_OFFSET: 3.75,
            SMOKE_SPAWN_INTERVAL: 0.03, // Spawns each frame (1 / 30fps = 0.0333333333333333)
            MODEL_ROTATION_TURNING_TIME: 0.5, // (15frames/30fps)
            MODEL_ROTATION_TURNING_ANGLE: 30 // When drifting, its multiplied by 2
        }
        this.PHYSICS_PROPERTIES = {
            JUMP_COOLDOWN: 352, //0x3f2 (24)
            JUMP_COYOTE_MS: 160, //0x3f4 (10)
            GRAVITY: 900, //0x416 (56.2500)
            JUMP_FORCE: 4596, //0x418 (287.2500)
        }
        this.ACCELERATION_PROPERTIES = {
            ACCELERATION: 480, // 0x428, each frame it sums to currentSpeed
            DECELERATION: 130, // checked value frame by frame
            ACCELERATION_INCREMENT_INTERVAL: 0.03, // 1fps / 30fps
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
        this.DIRECTION_ENUMS = {
            LEFT: -1,
            NONE: 0,
            RIGHT: 1
        }

        // Timers
        this.smokeSpawnTimer = new CustomTimer()
        this.speedLogicTimer = new CustomTimer()

        // Toggles
        this.isSmokeVisible = true
        this.isSmokeDark = false
        this.isTurboVisible = true

        // Keys pressed
        this.isAccelerationPressed = false
        this.isBrakePressed = false
        this.isReversingPressed = false
        this.isJumpingPressed = false
        this.isBoostPressed = false
        this.steerDirection = this.DIRECTION_ENUMS.NONE

        // Physics
        this.rigidBody = undefined

        // Runtime
        this.currentModelRotation = 0
        this.targetModelRotation = 0
        this.currentSmokes = []
        this.currentDetune = 0
        this.currentSpeed = 0
        this.targetSpeed = 0 // 0x39C, this is the max speed that it tries to reach
        this.currentSlideCharge = 0
        this.currentReserves = 0

        // Initialize
        this.scaleKart = 0.3276 * 1.5
        this.scale.set(this.scaleKart, this.scaleKart, this.scaleKart)
        this.initialize()
    }

    initialize() {
        this.addKartModel()
        this.addKartTires()
        this.addTurboExhaust()
        this.addShadowPlane()
        this.addSoundEmitters()
    }

    initializePhysics() {
        const rbDesc = RAPIER.RigidBodyDesc.dynamic()
            .setLinearDamping(0.1)
            .setCcdEnabled(true)
            .setTranslation(this.position.x, this.position.y, this.position.z)
            .setRotation({ x: this.quaternion.x, y: this.quaternion.y, z: this.quaternion.z, w: this.quaternion.w })
        this.rigidBody = this.main.scene.world.createRigidBody(rbDesc)

        const clDesc = RAPIER.ColliderDesc.ball(1)
            .setFriction(0.1)
            .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max)
            .setRestitution(0.6)
            .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max);
        this.main.scene.world.createCollider(clDesc, this.rigidBody)
    }

    addKartModel() {
        const kartModelCloned = this.main.assetsManager.kartAssets.kartModel.clone()
        kartModelCloned.name = "kartModel"
        this.add(kartModelCloned)

        // Calculate exhausts and add to Kart
        const leftExhaustMarker = new THREE.Object3D();
        const rightExhaustMarker = new THREE.Object3D();
        leftExhaustMarker.name = "leftExhaustMarker"
        rightExhaustMarker.name = "rightExhaustMarker"
        leftExhaustMarker.position.set(0.2835, 0.715, -0.783)
        rightExhaustMarker.position.set(-0.2835, 0.715, -0.783)
        leftExhaustMarker.rotation.x = this.KART_PROPERTIES.VERTICAL_ROTATION_EXHAUST_OFFSET
        rightExhaustMarker.rotation.x = this.KART_PROPERTIES.VERTICAL_ROTATION_EXHAUST_OFFSET
        kartModelCloned.add(leftExhaustMarker)
        kartModelCloned.add(rightExhaustMarker)
    }

    addKartTires() {
        this.add(new Tires(this.main, this))
    }

    addTurboExhaust() {
        const leftMarker = this.getObjectByName("leftExhaustMarker")
        const rightMarker = this.getObjectByName("rightExhaustMarker")
        this.add(new TurboExhaust(this.main, leftMarker, rightMarker))
    }

    addShadowPlane() {
        const kartShadowTextureCloned = this.main.assetsManager.kartAssets.shadowTexture.clone()

        const widthRatio = kartShadowTextureCloned.source.data.width / kartShadowTextureCloned.source.data.height
        const heightRatio = kartShadowTextureCloned.source.data.height / kartShadowTextureCloned.source.data.width

        const shadowPlaneGeometry = new THREE.PlaneGeometry(widthRatio, heightRatio)
        const shadowPlaneMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: kartShadowTextureCloned });
        shadowPlaneMaterial.color = new THREE.Color(0x808080) // This color is a work-around for opacity for SubtractiveBlending
        shadowPlaneMaterial.blending = THREE.SubtractiveBlending

        const shadowPlane = new THREE.Mesh(shadowPlaneGeometry, shadowPlaneMaterial)
        shadowPlane.position.y = 0.01
        shadowPlane.position.z = 0.15
        shadowPlane.rotation.x = Math.PI / 2
        shadowPlane.scale.set(widthRatio * 2.5, heightRatio * 1.5)
        shadowPlane.name = "shadow"

        this.add(shadowPlane)
    }

    addSoundEmitters() {
        const cameraAudioListener = this.main.gameCamera.getObjectByName("audioListener")
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

    getTires() {
        return this.getObjectByName("tires")
    }

    getTurboExhaust() {
        return this.getObjectByName("turboExhausts")
    }

    getShadow() {
        return this.getObjectByName("shadow")
    }

    doSmokeSpawning() {
        this.smokeSpawnTimer.update()
        if (this.smokeSpawnTimer.getElapsed() < this.KART_PROPERTIES.SMOKE_SPAWN_INTERVAL) return
        this.smokeSpawnTimer.resetAll()

        const leftMarker = this.getObjectByName("leftExhaustMarker")
        const rightMarker = this.getObjectByName("rightExhaustMarker")

        const leftExhaustPosition = leftMarker.getWorldPosition(new THREE.Vector3())
        const rightExhaustPosition = rightMarker.getWorldPosition(new THREE.Vector3())

        // Get kart's rotation relative to world
        const leftExhaustRotation = leftMarker.getWorldQuaternion(new THREE.Quaternion());
        const rightExhaustRotation = rightMarker.getWorldQuaternion(new THREE.Quaternion());

        // Clone the smokes
        const smokeLeft = new Smoke(this.main, this)
        const smokeRight = new Smoke(this.main, this)

        // Set position
        smokeLeft.position.copy(leftExhaustPosition)
        smokeRight.position.copy(rightExhaustPosition)

        // Set rotation
        smokeLeft.setRotationFromQuaternion(leftExhaustRotation);
        smokeRight.setRotationFromQuaternion(rightExhaustRotation);

        // TODO: New kart scaling and current rotation fucks up this, fix later
        // // Offset the position a little bit up because smoke 1st frame is offset
        // // and then a little bit far away from the exhaust bc its like that in the real game
        // const OFFSET_VECTOR = new THREE.Vector3(0, 0.1, -0.05).getWorldPosition(new THREE.Vector3())
        // smokeLeft.position.add(OFFSET_VECTOR)
        // smokeRight.position.add(OFFSET_VECTOR)

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

    handleKeyDown(key) {
        if (key === "x") this.isAccelerationPressed = true
        if (key === "arrowleft") this.steerDirection = this.DIRECTION_ENUMS.LEFT
        if (key === "arrowright") this.steerDirection = this.DIRECTION_ENUMS.RIGHT
    }

    handleKeyUp(key) {
        if (key === "x") this.isAccelerationPressed = false;
        if (key === "arrowleft" && this.steerDirection === this.DIRECTION_ENUMS.LEFT) this.steerDirection = this.DIRECTION_ENUMS.NONE;
        if (key === "arrowright" && this.steerDirection === this.DIRECTION_ENUMS.RIGHT) this.steerDirection = this.DIRECTION_ENUMS.NONE;
    }

    doSpeedLogic(deltaTime) {
        // Calculate equivalent acceleration and deceleration based on the acceleration increment interval
        const equivalentAcceleration = this.ACCELERATION_PROPERTIES.ACCELERATION / this.ACCELERATION_PROPERTIES.ACCELERATION_INCREMENT_INTERVAL;
        const equivalentDeceleration = this.ACCELERATION_PROPERTIES.DECELERATION / this.ACCELERATION_PROPERTIES.ACCELERATION_INCREMENT_INTERVAL;
        const acceleration = this.isAccelerationPressed ? equivalentAcceleration : -equivalentDeceleration;

        // Calculate the change in speed based on acceleration and deltaTime
        const speedChange = acceleration * deltaTime;
        this.currentSpeed += speedChange;

        // Cap the speed
        this.currentSpeed = Math.min(Math.max(this.currentSpeed, 0), this.ACCELERATION_PROPERTIES.SPEED_BASE);
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

    doModelRotation(deltaTime) {
        const currentSteerDirection = this.isAccelerationPressed ? this.steerDirection : 0;
        const rotationRate = (this.KART_PROPERTIES.MODEL_ROTATION_TURNING_ANGLE / this.KART_PROPERTIES.MODEL_ROTATION_TURNING_TIME);
        this.targetModelRotation = currentSteerDirection !== 0 ? currentSteerDirection * this.KART_PROPERTIES.MODEL_ROTATION_TURNING_ANGLE : 0

        // Calculate scaling factor based on difference between current and target rotations
        // This is to rotate quicker if player changes their steering direction
        const rotationDifference = Math.abs(this.targetModelRotation - this.currentModelRotation);
        const scalingFactor = 1 + (rotationDifference / this.KART_PROPERTIES.MODEL_ROTATION_TURNING_ANGLE);

        // Update current rotation gradually towards the target, with scaled rotation rate
        const maxRotationChange = rotationRate * deltaTime * scalingFactor;
        const rotationDiff = this.targetModelRotation - this.currentModelRotation;
        this.currentModelRotation += Math.sign(rotationDiff) * Math.min(Math.abs(rotationDiff), maxRotationChange);

        // Clamp the value
        this.currentModelRotation = Math.min(Math.max(this.currentModelRotation, -this.KART_PROPERTIES.MODEL_ROTATION_TURNING_ANGLE), this.KART_PROPERTIES.MODEL_ROTATION_TURNING_ANGLE);

        // Decrease rotation when idle
        if (currentSteerDirection === 0) {
            const decreateRatio = 0.25
            const decreaseAmount = rotationRate * deltaTime * decreateRatio;
            this.currentModelRotation += Math.sign(this.currentModelRotation) * Math.min(Math.abs(this.currentModelRotation), decreaseAmount);
        }

        // Set new rotations
        const newRotationValue = -degToRad(this.currentModelRotation);
        this.getKartModel().rotation.y = newRotationValue;
        this.getTires().rotation.y = newRotationValue;
        this.getTurboExhaust().rotation.y = newRotationValue;
        this.getShadow().rotation.z = -newRotationValue;
    }

    copyPhysicsToObject3D() {
        const bodyTranslation = this.rigidBody.translation()
        const bodyRotation = this.rigidBody.rotation()
        this.position.set(bodyTranslation.x, bodyTranslation.y, bodyTranslation.z)
        this.quaternion.set(bodyRotation.x, bodyRotation.y, bodyRotation.z, bodyRotation.w)
    }

    update(deltaTime) {
        // Copy from Physics
        this.copyPhysicsToObject3D()

        // Tires
        this.getTires().update(deltaTime)

        // Turbo exhaust
        if (this.isTurboVisible) this.getObjectByName("turboExhausts").update()

        //Smoke
        this.currentSmokes.forEach(smoke => smoke.update())
        if (this.isSmokeVisible) this.doSmokeSpawning()

        // Speed logic
        this.doSpeedLogic(deltaTime)

        // Model rotation depending on speed
        this.doModelRotation(deltaTime)

        // Sound
        this.doKartSound()
    }

}