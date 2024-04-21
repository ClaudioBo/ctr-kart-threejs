import * as THREE from 'three';

export default class GameCamera extends THREE.PerspectiveCamera {
    constructor(main, fov, aspect, near, far) {
        super(fov, aspect, near, far);

        this.main = main;
        this.following = undefined
        this.isClose = true
        this.isMirror = false

        this.test = {
            x: 0,
            y: 2.5,
            z: -4.4,

            xr: 0.14,
            yr: Math.PI,
            zr: 0,

            fov: 70,
        }

        this.closeCameraOffsetPosition = new THREE.Vector3(0, 1.7, -3.35)
        this.farCameraOffsetPosition = new THREE.Vector3(0, 2.5, -4.4)

        this.closeCameraOffsetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.077, Math.PI, 0));
        this.farCameraOffsetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.14, Math.PI, 0));

        this.closeCameraOffsetPositionReversed = new THREE.Vector3(0, 1.7, 3.35)
        this.farCameraOffsetPositionReversed = new THREE.Vector3(0, 2.5, 4.4)

        this.closeCameraOffsetRotationReversed = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.077, 0, 0));
        this.farCameraOffsetRotationReversed = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.14, 0, 0));

        this.initializeListener()
        this.updateTest()
    }

    updateTest() {
        this.farCameraOffsetPosition = new THREE.Vector3(this.test.x, this.test.y, this.test.z)
        this.farCameraOffsetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.test.xr, this.test.yr, this.test.zr));
        this.fov = this.test.fov
    }

    initializeListener() {
        const audioListener = new THREE.AudioListener();
        audioListener.name = "audioListener"
        this.add(audioListener);
    }

    followPlayer(kart) {
        this.following = kart
    }

    update(deltaTime) {
        if (!this.following) return;

        const followingPosition = this.following.getWorldPosition(new THREE.Vector3());
        const followingRotation = this.following.getWorldQuaternion(new THREE.Quaternion());

        const currentBaseOffsetPosition = this.isClose ?
            (this.isMirror ? this.closeCameraOffsetPositionReversed : this.closeCameraOffsetPosition) :
            (this.isMirror ? this.farCameraOffsetPositionReversed : this.farCameraOffsetPosition);

        const currentBaseOffsetRotation = this.isClose ?
            (this.isMirror ? this.closeCameraOffsetRotationReversed : this.closeCameraOffsetRotation) :
            (this.isMirror ? this.farCameraOffsetRotationReversed : this.farCameraOffsetRotation);

        const followingScale = this.following.scale;
        const currentBaseOffsetPositionScaled = currentBaseOffsetPosition.clone().multiply(followingScale);

        const finalRotation = followingRotation.clone().multiply(currentBaseOffsetRotation);
        this.quaternion.copy(finalRotation);

        const offsetPosition = currentBaseOffsetPositionScaled.clone().applyQuaternion(followingRotation);
        this.position.copy(followingPosition).add(offsetPosition);

        this.updateProjectionMatrix();
    }

    handleKeyDown(key) {
        if (key === "q") this.isClose = !this.isClose
        if (key === "e") this.isMirror = true
    }

    handleKeyUp(key) {
        if (key === "e") this.isMirror = false
    }

}