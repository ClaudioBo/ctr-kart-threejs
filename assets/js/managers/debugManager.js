export default class DebugManager {
    constructor(main) {
        this.main = main
    }

    updateDebugText() {
        const lines = [
            `isSoundEnabled (S): ${this.main.isSoundEnabled}`,
            `isAccelerating (Space): ${this.main.mainKart.isAccelerating}`,
            `currentSpeed: ${this.main.mainKart.currentSpeed}`,
            `targetSpeed: ${this.main.mainKart.targetSpeed}`,
            // `currentSlideCharge: ${currentSlideCharge}`,
            // `currentReserves: ${currentReserves}`,
        ]

        const output = lines.join("<br>")
        document.getElementById("debug").innerHTML = output
    }

    updateDebugBars() {
        const speedPercentage = (this.main.mainKart.currentSpeed * 100) / this.main.mainKart.ACCELERATION_PROPERTIES.SPEED_BASE
        document.getElementById("currentSpeedBar").style.setProperty("height", `${speedPercentage}%`)
    }

    update() {
        this.updateDebugText()
        this.updateDebugBars()
    }

}