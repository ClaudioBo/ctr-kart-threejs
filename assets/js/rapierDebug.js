import * as THREE from 'three';

export default class RapierDebugRenderer {
    mesh
    world

    constructor(main) {
        this.main = main
        this.world = main.scene.world
        this.mesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true }))
        this.mesh.frustumCulled = false
        this.main.scene.add(this.mesh)
    }

    update() {
        if (this.main.isDebugEnabled) {
            const { vertices, colors } = this.world.debugRender()
            this.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
            this.mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
            this.mesh.visible = true
        } else {
            this.mesh.visible = false
        }
    }
}