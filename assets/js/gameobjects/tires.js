import * as THREE from 'three';
import { setSpriteFrame, closestStepValue } from '../utils.js'

import { CustomTimer } from '../utils.js';

export default class Tires extends THREE.Group {
    constructor(main, kart) {
        super()
        this.main = main
        this.kart = kart
        this.name = "tires"

        // Constants
        this.TIRE_SCALE = 0.5; // by eye: 0.45, original short value 0xCCC (3276), converted to Float and multiplied by 0.1 = 0.45xxxx
        this.TIRE_POSITION_OFFSET_Y = 0.25;
        this.TIRE_POSITION_OFFSET_BACK_X = 0.575;
        this.TIRE_POSITION_OFFSET_FRONT_X = 0.575;
        this.TIRE_POSITION_OFFSET_BACK_Z = 0.4;
        this.TIRE_POSITION_OFFSET_FRONT_Z = 0.8;
        this.TIRE_FRAME_CHANGE_RATE = 3;
        this.TIRE_FRAME1_COLOR = new THREE.Color(0xffffff);
        this.TIRE_FRAME2_COLOR = new THREE.Color(0xbfbfbf);

        this.SPRITESHEET_PROPERTIES = {
            totalFrames: 17,
            frameWidth: 32,
            frameHeight: 32,
            textureWidth: 544,
            textureHeight: 32,
        }

        // Timers
        this.tireColorTimer = new CustomTimer()

        this.initialize()
    }

    createTire() {
        const tireSpriteMaterial = new THREE.SpriteMaterial({ map: this.main.assetsManager.kartAssets.tireTexture.clone() });
        const tireSprite = new THREE.Sprite(tireSpriteMaterial);
        tireSprite.scale.set(this.TIRE_SCALE, this.TIRE_SCALE, 1);
        setSpriteFrame(tireSprite, this.SPRITESHEET_PROPERTIES, 0, false, 0)
        return tireSprite
    }

    initialize() {
        const positions = [
            new THREE.Vector3(-this.TIRE_POSITION_OFFSET_BACK_X, this.TIRE_POSITION_OFFSET_Y, -this.TIRE_POSITION_OFFSET_BACK_Z,), // Back right
            new THREE.Vector3(-this.TIRE_POSITION_OFFSET_FRONT_X, this.TIRE_POSITION_OFFSET_Y, this.TIRE_POSITION_OFFSET_FRONT_Z,), // Front right
            new THREE.Vector3(this.TIRE_POSITION_OFFSET_BACK_X, this.TIRE_POSITION_OFFSET_Y, -this.TIRE_POSITION_OFFSET_BACK_Z,), // Back left
            new THREE.Vector3(this.TIRE_POSITION_OFFSET_FRONT_X, this.TIRE_POSITION_OFFSET_Y, this.TIRE_POSITION_OFFSET_FRONT_Z,), // Front left
        ];
        for (let i = 0; i < 4; i++) {
            const tireNew = this.createTire()
            tireNew.position.copy(positions[i])
            tireNew.name = `Wheel #${i}`
            this.add(tireNew)
        }
    }

    changeTireSpriteBasedOnCamera(tireSprite, camera) {
        // Get the world position and rotation of the tireGroup
        const tireGroupWorldPosition = tireSprite.getWorldPosition(new THREE.Vector3());
        const tireGroupWorldRotation = tireSprite.getWorldQuaternion(new THREE.Quaternion());

        // Calculate the relative position vector with the camera's position
        const relativePosition = tireGroupWorldPosition.clone().sub(camera.position);

        // Apply the inverse of tireGroup's rotation to the relative position vector
        const inverseRotation = tireGroupWorldRotation.clone().conjugate();
        relativePosition.applyQuaternion(inverseRotation);

        // Calculate the angle in degrees to the camera on the X-Z plane
        const angleToCameraX = Math.atan2(relativePosition.z, relativePosition.x) * (180 / Math.PI);

        // Calculate the angle in degrees to the camera on the Y-Z plane
        const angleToCameraY = Math.atan2(relativePosition.y, Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z)) * (180 / Math.PI);

        // Get the relative rotation of the camera
        const relativeCameraRotation = new THREE.Quaternion();
        relativeCameraRotation.copy(camera.quaternion).premultiply(tireGroupWorldRotation.clone().conjugate());

        // Convert the relative rotation to Euler angles
        const relativeCameraEuler = new THREE.Euler().setFromQuaternion(relativeCameraRotation);

        // Convert the relative rotation to degrees
        const relativeCameraRotationZDegrees = THREE.MathUtils.radToDeg(relativeCameraEuler.z);

        // Sum variables
        let frameIndex = 0
        let isMirror = false

        // Very promising and simpler sprite rotation method...
        let rotationDegree = 180 - relativeCameraRotationZDegrees;

        // I'll get the closest step value to make the rotations more choppy on purpose
        // Kinda matching the low frames of the spritesheet, or make the rotations less noticeable
        const tireTotalFrames = this.SPRITESHEET_PROPERTIES.totalFrames
        rotationDegree = closestStepValue(rotationDegree, tireTotalFrames / 2)

        // Determining mirroring the frame based on angleToCameraX
        if (angleToCameraX < -90 || angleToCameraX > 90) {
            isMirror = true;
        }

        // Select frame based on angleToCameraX
        if (angleToCameraX >= 0 && angleToCameraX <= 90) {
            frameIndex = Math.floor(tireTotalFrames - (angleToCameraX / 90) * tireTotalFrames);
        } else if (angleToCameraX > -90 && angleToCameraX < 0) {
            frameIndex = Math.floor(tireTotalFrames - (-angleToCameraX / 90) * tireTotalFrames);
        } else if (angleToCameraX > -180 && angleToCameraX < -90) {
            frameIndex = Math.floor(tireTotalFrames - ((180 + angleToCameraX) / 90) * tireTotalFrames);
        } else if (angleToCameraX > 90 && angleToCameraX < 180) {
            frameIndex = Math.floor(tireTotalFrames - ((180 - angleToCameraX) / 90) * tireTotalFrames);
        }

        // Select the frame based on angleToCameraY
        const heightFactor = (angleToCameraY + 90) / 180;
        frameIndex = Math.floor(frameIndex * (1 - Math.abs(heightFactor - 0.5) * 2));

        // Update the display properties of the tire
        setSpriteFrame(tireSprite, this.SPRITESHEET_PROPERTIES, frameIndex, isMirror, rotationDegree);
    }

    doTireColorChange() {
        const tires = [
            this.children[0].material,
            this.children[1].material,
            this.children[2].material,
            this.children[3].material,
        ]

        const baseFrameDuration = this.TIRE_FRAME_CHANGE_RATE;
        const frameDuration = baseFrameDuration / (this.kart.currentSpeed / this.kart.ACCELERATION_PROPERTIES.SPEED_BASE);

        this.tireColorTimer.update()
        const currentTimeMS = this.tireColorTimer.getElapsed() * 1000;
        const selectedFrame = Math.floor(currentTimeMS / frameDuration) % 2 === 0 ? this.TIRE_FRAME1_COLOR : this.TIRE_FRAME2_COLOR;

        tires.forEach(t => this.changeTireColorFrame(t, selectedFrame))
    }

    changeTireColorFrame(tire, selectedFrame) {
        tire.color = selectedFrame
    }

    updateKartTireFrames() {
        this.children.forEach(sprite => this.changeTireSpriteBasedOnCamera(sprite, this.main.camera))
    }

    update() {
        this.updateKartTireFrames()
        this.doTireColorChange()
    }

}