// import GUI from 'lil-gui';

export default class DebugManager {
    constructor(main) {
        this.main = main
    }

    updateDebugText() {
        const lines = [
            `isGround: ${this.main.mainKart.isGround}`,
            `currentAngle: ${this.main.mainKart.currentAngle}`,
            `currentSpeed: ${this.main.mainKart.currentSpeed}`,
            `targetSpeed: ${this.main.mainKart.targetSpeed}`,
            ``,
            `currentSlideCharge: ${this.main.mainKart.currentSlideCharge}`,
            `currentReserves: ${this.main.mainKart.currentReserves}`,
            `turboVisibilityTime: 0.0`,
            ``,
            `modelRotation: ${this.main.mainKart.currentModelRotation}`,
            `frontTireRotation: ${~~this.main.mainKart.getTires().currentFrontTireRotation}`,
            ``,
            `isDebugEnabled (W): ${this.main.isDebugEnabled}`,
            `isSoundEnabled (S): ${this.main.isSoundEnabled}`,
            `isClose (Q): ${this.main.gameCamera.isClose}`,
            `isMirror (E): ${this.main.gameCamera.isMirror}`,
            `isAccelerating (X): ${this.main.mainKart.isAccelerating}`,
            `steerDirection (< / >): ${this.main.mainKart.steerDirection}`,
            // `currentSlideCharge: ${currentSlideCharge}`,
            // `currentReserves: ${currentReserves}`,
        ]

        const output = lines.join("<br>")
        document.getElementById("debug").innerHTML = output
    }

    handleKeyDown(key) {
        if (key == "p") document.getElementById("overlayImage").hidden = !document.getElementById("overlayImage").hidden
        if (key == "w") this.main.isDebugEnabled = !this.main.isDebugEnabled
        
    }

    addToGUI() {
        const cameraDistanceFolder = this.main.gui.addFolder("Camera Distance")
        cameraDistanceFolder.add(this.main.gameCamera.test, "x").step(0.001).onChange(() => this.main.gameCamera.updateTest())
        cameraDistanceFolder.add(this.main.gameCamera.test, "y").step(0.001).onChange(() => this.main.gameCamera.updateTest())
        cameraDistanceFolder.add(this.main.gameCamera.test, "z").step(0.001).onChange(() => this.main.gameCamera.updateTest())
        cameraDistanceFolder.add(this.main.gameCamera.test, "xr").step(0.001).name("xRot").onChange(() => this.main.gameCamera.updateTest())
        cameraDistanceFolder.add(this.main.gameCamera.test, "yr").step(0.001).name("yRot").onChange(() => this.main.gameCamera.updateTest())
        cameraDistanceFolder.add(this.main.gameCamera.test, "zr").step(0.001).name("zRot").onChange(() => this.main.gameCamera.updateTest())
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