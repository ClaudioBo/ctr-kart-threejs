// import GUI from 'lil-gui';

export default class DebugManager {
    constructor(main) {
        this.main = main
        this.addToGUI()
    }

    updateDebugText() {
        const lines = [
            `isSoundEnabled (S): ${this.main.isSoundEnabled}`,
            ``,
            `isAccelerating (Space): ${this.main.mainKart.isAccelerating}`,
            `currentSpeed: ${this.main.mainKart.currentSpeed}`,
            `targetSpeed: ${this.main.mainKart.targetSpeed}`,
            ``,
            `currentSlideCharge: ${this.main.mainKart.currentSlideCharge}`,
            `currentReserves: ${this.main.mainKart.currentReserves}`,
            `turboVisibilityTime: 0.0`,
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
        const cameraFolder = this.main.gui.addFolder("Camera")
        const step = 0.01
        cameraFolder.add(this.main.camera.position, "x").step(step)
        cameraFolder.add(this.main.camera.position, "y").step(step)
        cameraFolder.add(this.main.camera.position, "z").step(step)
        cameraFolder.add(this.main.camera.rotation, "x").name("xRot").step(0.0001)
        cameraFolder.add(this.main.camera.rotation, "y").name("yRot").step(0.0001)
        cameraFolder.add(this.main.camera.rotation, "z").name("zRot").step(0.0001)
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