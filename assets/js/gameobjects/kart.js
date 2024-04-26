import * as RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import SmokeHolder from './smokeHolder.js';
import Tires from './tires.js';
import TurboExhaust from './turboExhaust.js';

import { degToRad } from 'three/src/math/MathUtils.js';
import { CustomTimer } from '../utils.js';

export default class Kart extends THREE.Group {
    constructor(main) {
        super()
        this.main = main

        // Constants
        this.KART_PROPERTIES = {
            LEFT_EXHAUST_POSITION: new THREE.Vector3(0.2835, 0.715, -0.783),
            RIGHT_EXHAUST_POSITION: new THREE.Vector3(-0.2835, 0.715, -0.783),
            MODEL_ROTATION_TURNING_TIME: 0.5, // (15frames/30fps)
            MODEL_ROTATION_TURNING_ANGLE: 30 // When drifting, its multiplied by 2
        }
        this.PHYSICS_PROPERTIES = {
            JUMP_COOLDOWN: 352, //0x3f2 (24)
            JUMP_COYOTE_MS: 160, //0x3f4 (10)
            GRAVITY: 900, //0x416 (56.2500)
            JUMP_FORCE: 4596, //0x418 (287.2500)
            TURN_ANGLE_DEGREE: 32,
            TURN_ANGLE_RATE: 0.03,
        }
        this.ACCELERATION_PROPERTIES = {
            ACCELERATION: 30, // 0x428, each frame it sums to currentSpeed
            DECELERATION: 8.125, // checked value frame by frame
            ACCELERATION_INCREMENT_INTERVAL: 0.03, // 1fps / 30fps
            // ACCELERATION_RESERVES: 1152, // 0x42A, idk
            SPEED_BASE: 821.25, // 0x42C, max speed without doing turbos
            SPEED_BASE_SINGLETURBO: 128, // 0x430
            SPEED_EACH_TURBO: 32,
            SLIDECHARGE_INCREMENT: 2,
            SLIDECHARGE_INCREMENT_MS: 0.33,
            SLIDECHARGE_MIN_TURBO: 33,
            SLIDECHARGE_MAX_VALUE: 60,
            DETUNE_START: -1100,
            DETUNE_MODIFIER: 1.95
        }
        this.DIRECTION_ENUMS = {
            LEFT: -1,
            NONE: 0,
            RIGHT: 1
        }

        // Timers
        this.speedLogicTimer = new CustomTimer()

        // Toggles
        this.isTurboVisible = true

        // Keys pressed
        this.isAccelerationPressed = false
        this.isBrakePressed = false
        this.isReversingPressed = false
        this.isJumpingPressed = false
        this.isBoostPressed = false
        this.steerDirection = this.DIRECTION_ENUMS.NONE

        // Physics
        this.currentAngle = 0
        this.currentSpeed = 0
        this.targetSpeed = 0
        this.isGround = false
        this.characterRigidBodySize = 0.26
        this.characterRigidBody
        this.characterCollider

        // Runtime
        this.currentModelRotation = 0
        this.targetModelRotation = 0
        this.currentDetune = 0
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
        this.addSmokeHolder()
        this.addSoundEmitters()
    }

    initializePhysics() {
        this.currentAngle = this.rotation.y

        const rbDesc = RAPIER.RigidBodyDesc.dynamic()
            .setCcdEnabled(true)
            .setTranslation(this.position.x, this.position.y, this.position.z)
            .setRotation({ x: this.quaternion.x, y: this.quaternion.y, z: this.quaternion.z, w: this.quaternion.w })
        const clDesc = RAPIER.ColliderDesc.ball(this.characterRigidBodySize)
            .setMass(0.5235987901687622) // Hard-coded mass if setting rigidBodySize to 1

        this.characterRigidBody = this.main.scene.world.createRigidBody(rbDesc)
        this.characterCollider = this.main.scene.world.createCollider(clDesc, this.characterRigidBody)
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
        this.add(new TurboExhaust(this.main, this))
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

    addSmokeHolder() {
        this.smokeHolder = new SmokeHolder(this.main, this)
        this.add(this.smokeHolder)
    }

    addSoundEmitters() {
        const kartSounds = this.main.assetsManager.kartAssets.kartSounds

        const cameraAudioListener = this.main.gameCamera.getObjectByName("audioListener")
        const engineEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineJetEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineFillingEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineHopEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineLandEmitter = new THREE.PositionalAudio(cameraAudioListener);
        const engineSkidEmitter = new THREE.PositionalAudio(cameraAudioListener);

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

    getSmokesHolder() {
        return this.getObjectByName("smokeHolder")
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

    computePhysics(deltaTime) {
        // check if grounded
        const groundRaycast = this.main.scene.world.castRay(
            new RAPIER.Ray(this.characterRigidBody.translation(), { x: 0, y: -1, z: 0 }),
            1,
            false,
            undefined,
            undefined,
            undefined,
            this.characterRigidBody,
        )
        this.isGround = groundRaycast !== null

        // steering angle
        const rotationRate = (this.PHYSICS_PROPERTIES.TURN_ANGLE_DEGREE / this.PHYSICS_PROPERTIES.TURN_ANGLE_RATE)
        const angleChange = rotationRate * this.steerDirection * deltaTime / 1000
        this.currentAngle -= this.currentSpeed ? angleChange : 0;

        // drifting controls

        // acceleration and deceleration logic
        this.doSpeedLogic(deltaTime)

        // impulse vector
        const test = this.currentSpeed * 0.01
        const characterImpulse = new THREE.Vector3(0, 0, test)

        // drifting steering

        // copy angle to impulse vector
        const currentAngleQuat = new THREE.Quaternion().setFromAxisAngle(this.up, this.currentAngle)
        characterImpulse.applyQuaternion(currentAngleQuat)

        // jump

        // apply impulse vector
        if (characterImpulse.length() > 0) {
            this.characterRigidBody.applyImpulse(characterImpulse, true)
        }

        // damping
        this.characterRigidBody.applyImpulse({
            x: -this.characterRigidBody.linvel().x * 0.4,
            y: 0,
            z: -this.characterRigidBody.linvel().z * 0.4,
        }, true)
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
        this.getSmokesHolder().rotation.y = newRotationValue;
    }

    copyPhysicsPositionsToObject3D() {
        const bodyTranslation = this.characterRigidBody.translation()
        this.position.set(bodyTranslation.x, bodyTranslation.y - this.characterRigidBodySize, bodyTranslation.z)
        this.rotation.set(0, this.currentAngle, 0)
    }

    update(deltaTime) {
        // Compute physics
        this.computePhysics(deltaTime)

        // Model Rotation
        this.doModelRotation(deltaTime)

        // Sound
        this.doKartSound()

        // Copy from Physics
        this.copyPhysicsPositionsToObject3D()

        // Tires
        this.getTires().update(deltaTime)

        // Turbo exhaust
        if (this.isTurboVisible) this.getObjectByName("turboExhausts").update()

        // Smoke
        this.smokeHolder.update()
    }

}