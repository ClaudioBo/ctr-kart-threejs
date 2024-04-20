import * as THREE from 'three';

export default class GameCamera extends THREE.PerspectiveCamera {
    constructor(main, fov, aspect, near, far) {
        super(fov, aspect, near, far);

        this.main = main;
        this.following = undefined
        this.isClose = true
        this.isMirror = false

        this.closeCameraOffsetPosition = new THREE.Vector3(0, 1.81, -2.77)
        this.farCameraOffsetPosition = new THREE.Vector3(0, 2.25, -3.4)

        this.closeCameraOffsetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, Math.PI, 0));
        this.farCameraOffsetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.09, Math.PI, 0));

        this.closeCameraOffsetPositionReversed = new THREE.Vector3(0, 1.81, 2.77)
        this.farCameraOffsetPositionReversed = new THREE.Vector3(0, 2.25, 3.4)

        this.closeCameraOffsetRotationReversed = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0, 0));
        this.farCameraOffsetRotationReversed = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.09, 0, 0));

        this.initializeListener()
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
        if (key === "a") this.isClose = !this.isClose
        if (key === "d") this.isMirror = true
    }

    handleKeyUp(key) {
        if (key === "d") this.isMirror = false
    }

}