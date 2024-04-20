// import GUI from 'lil-gui';

export default class DebugManager {
    constructor(main) {
        this.main = main
    }

    updateDebugText() {
        const lines = [
            `isSoundEnabled (S): ${this.main.isSoundEnabled}`,
            ``,
            `currentSpeed: ${this.main.mainKart.currentSpeed}`,
            `targetSpeed: ${this.main.mainKart.targetSpeed}`,
            ``,
            `currentSlideCharge: ${this.main.mainKart.currentSlideCharge}`,
            `currentReserves: ${this.main.mainKart.currentReserves}`,
            `turboVisibilityTime: 0.0`,
            ``,
            `isClose (A): ${this.main.gameCamera.isClose}`,
            `isMirror (D): ${this.main.gameCamera.isMirror}`,
            `isAccelerating (X): ${this.main.mainKart.isAccelerating}`,
            // `currentSlideCharge: ${currentSlideCharge}`,
            // `currentReserves: ${currentReserves}`,
        ]

        const output = lines.join("<br>")
        document.getElementById("debug").innerHTML = output
    }

    handleKeyDown(key) {
        if(key == "p") {
            document.getElementById("overlayImage").hidden = !document.getElementById("overlayImage").hidden
        }
    }

    addToGUI(){
        const kartFolder = this.main.gui.addFolder("Kart")
        const step = 0.01
        kartFolder.add(this.main.mainKart.position, "x").step(step)
        kartFolder.add(this.main.mainKart.position, "y").step(step)
        kartFolder.add(this.main.mainKart.position, "z").step(step)
        kartFolder.add(this.main.mainKart.rotation, "x").name("xRot").step(0.0001)
        kartFolder.add(this.main.mainKart.rotation, "y").name("yRot").step(0.0001)
        kartFolder.add(this.main.mainKart.rotation, "z").name("zRot").step(0.0001)
    }

    updateDebugBars() {
        const speedPercentage = (this.main.mainKart.currentSpeed * 100) / this.main.mainKart.ACCELERATION_PROPERTIES.SPEED_BASE
        document.getElementById("currentSpeedbar").style.setProperty("height", `${speedPercentage}%`)
    }

    update() {
        this.updateDebugText()
        this.updateDebugBars()
    }

}