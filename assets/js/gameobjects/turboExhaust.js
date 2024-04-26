import * as THREE from 'three';
import { CustomTimer } from '../utils.js';

export default class TurboExhaust extends THREE.Group {
    constructor(main, kart) {
        super()

        this.TURBO_ANIMATION_SPEED = 0.03
        this.TURBO_TOTAL_FRAMES = 8

        // Inspired on https://github.com/CTR-tools/CTR-ModSDK/blob/8d3c0c6eb262852a150fd50e2b5ad4335f363b15/mods/Modules/ReservesMeter/src/Turbo_Increment.c#L143
        this.TURBO_DISAPPEAR_AFTER_QUICKDEATH = 0.1 // Suggested on L#301
        this.TURBO_DISAPPEAR_AFTER_NORMALDEATH = 2.1 // 6/4 frames of 30fps
        this.TURBO_DISAPPEAR_AFTER_SLOWDEATH = 8.5 // 255 frames of 30fps?
        // Inspired on https://github.com/CTR-tools/CTR-ModSDK/blob/8d3c0c6eb262852a150fd50e2b5ad4335f363b15/include/namespace_Vehicle.h#L280
        this.TURBO_FIRE_SCALE_SMALL_RATIO = 0.25 // // One power-slide and green hang time is 5 (= 1 / 4)
        this.TURBO_FIRE_SCALE_MEDIUM_RATIO = 0.5 // Two power-slides and yellow hang time is 6 (= 2 / 4)
        this.TURBO_FIRE_SCALE_LARGE_RATIO = 0.75 // Three power-slides, red hang time, and start boost is 7 (= 3 / 4)
        this.TURBO_FIRE_SCALE_XLARGE_RATIO = 1 // Turbo pad and USF is 8 (= 4 / 4)

        this.main = main
        this.kart = kart
        this.name = "turboExhausts"
        this.currentFrame = 0

        this.timer;

        this.initialize()
    }

    createTurboObject() {
        const turboGroup = new THREE.Group()
        let isFirstIteration = true
        this.main.assetsManager.kartAssets.turboModels.forEach(turboFrame => {
            const turboFrameCloned = turboFrame.clone()
            if (!isFirstIteration) {
                turboFrameCloned.visible = false
            }
            isFirstIteration = false
            turboGroup.add(turboFrameCloned)
        })
        return turboGroup
    }

    initialize() {
        const leftExhaustModel = this.createTurboObject()
        const rightExhaustModel = this.createTurboObject()

        leftExhaustModel.name = "Left Exhaust Model"
        rightExhaustModel.name = "Right Exhaust Model"

        leftExhaustModel.visible = false
        rightExhaustModel.visible = false

        leftExhaustModel.position.copy(this.kart.KART_PROPERTIES.LEFT_EXHAUST_POSITION)
        rightExhaustModel.position.copy(this.kart.KART_PROPERTIES.RIGHT_EXHAUST_POSITION)
        rightExhaustModel.scale.x = -1 // Mirror

        this.timer = new CustomTimer()

        this.add(leftExhaustModel)
        this.add(rightExhaustModel)
    }

    getExhaustObject(isRight) {
        return this.children[+isRight]
    }

    nextTurboFrame() {
        const lastFrame = this.currentFrame
        let currentFrame = lastFrame + 1

        if (currentFrame > this.TURBO_TOTAL_FRAMES - 1) {
            currentFrame = 0
        }

        this.changeFrame(this.getExhaustObject(false), lastFrame, currentFrame)
        this.changeFrame(this.getExhaustObject(true), lastFrame, currentFrame)

        this.currentFrame = currentFrame
    }

    changeFrame(turboObject, lastFrame, currentFrame) {
        const currentFrameModel = turboObject.children[currentFrame];
        const lastFrameModel = turboObject.children[lastFrame];
        lastFrameModel.visible = false
        currentFrameModel.visible = true
    }

    update() {
        this.timer.update()
        if (this.timer.getElapsed() < this.TURBO_ANIMATION_SPEED) return
        this.timer.resetAll()
        this.nextTurboFrame()
    }


}