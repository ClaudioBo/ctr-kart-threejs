import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

import { Timer } from 'three/addons/misc/Timer.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Function to set sprite frame, mirroring and rotation
export function setSpriteFrame(sprite, spritesheetProperties, frameIndex, mirror = false, rotationDegree = 0) {
    const totalFrames = spritesheetProperties.totalFrames
    const frameWidth = spritesheetProperties.frameWidth
    const frameHeight = spritesheetProperties.frameHeight
    const textureWidth = spritesheetProperties.textureWidth
    const textureHeight = spritesheetProperties.textureHeight

    const x = (frameIndex % totalFrames) * frameWidth;
    const y = Math.floor(frameIndex / totalFrames) * frameHeight;

    // Calculate texture offsets and repeats
    const offsetX = x / textureWidth;
    const offsetY = 1 - (y + frameHeight) / textureHeight;
    const repeatX = frameWidth / textureWidth;
    const repeatY = frameHeight / textureHeight;

    // Set texture coordinates
    sprite.material.map.offset.set(offsetX, offsetY);
    sprite.material.map.repeat.set(repeatX, repeatY);

    // Rotate texture by degrees
    sprite.material.rotation = rotationDegree * Math.PI / 180;

    // Mirror texture horizontally
    if (mirror) {
        sprite.material.map.repeat.x *= -1;
        sprite.material.map.offset.x += repeatX;
    }
}


export async function loadModel(materialPath, objectPath, multiplyVertexColorsMode = 0, materialCallback = undefined, scaleGeometry = undefined) {
    // Initialize loaders
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    // Load the materials file
    if (materialPath) {
        const materials = await new Promise((resolve, reject) => {
            mtlLoader.load(materialPath, resolve);
        });

        // Preload materials
        materials.preload()

        // Set the materials to the object loader
        objLoader.setMaterials(materials);
    }

    // Load the object file
    const model = await new Promise((resolve, reject) => {
        objLoader.load(objectPath, resolve);
    });

    // Loop through each material and apply modifications
    // traverse was needed because iterating with forEach didn't work haha
    if (materialCallback)
        model.traverse(child => {
            if (child instanceof THREE.Mesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => materialCallback(material));
                }
                if (scaleGeometry) {
                    child.geometry.scale(scaleGeometry, scaleGeometry, scaleGeometry)
                }
                if (child.geometry?.attributes && multiplyVertexColorsMode) {
                    // multiplyVertexColorsMode = 1: Multiply by 1.6
                    // multiplyVertexColorsMode = 2: Multiply by 6.4
                    const multiplyBy = multiplyVertexColorsMode == 1 ? 1.6 : 6.4
                    child.geometry.attributes.color.array = child.geometry.attributes.color.array.map(color => color * multiplyBy) // Multiplied by 6.4 to match HEX color from emulation
                }
            }
        });

    return model;
}

// Helper function to reverse a number from a range
export function reverseNumber(startValue, currentValue, maxValue) {
    return startValue + (maxValue - startValue + 1) - (currentValue - startValue + 1);
}

// Helper function to normalize a value to maxValue
export function normalizeToMax(currentValue, maxValue) {
    return currentValue / maxValue;
}

// Helper function to normalize/scale a value to scaleMax
export function scaleValue(currentValue, scaleMax, originalMax) {
    return (currentValue * scaleMax) / originalMax;
}

// Helper function to make a value close to a step value
export function closestStepValue(value, step) {
    return Math.round(value / step) * step
}

// Helper function to retrieve geometry points to be used for Convex Hull
export function getGeometryPoints(object3d) {
    let vertices = null
    let indexes = null

    object3d.traverse((o) => {
        if (o.isMesh) {
            vertices = o.geometry.attributes.position.array;
            if (!indexes) {
                generateIndexes(o.geometry)
            }
            indexes = o.geometry.index.array;
        }
    });

    return { vertices: new Float32Array(vertices), indexes: new Uint32Array(indexes) };
}

export function generateIndexes(geometry) {
    const indices = [];
    for (let i = 0; i < geometry.attributes.position.count; i += 3) {
        indices.push(i, i + 1, i + 2);
    }

    const indicesTypedArray = new Uint16Array(indices);
    const indexAttribute = new THREE.BufferAttribute(indicesTypedArray, 1);
    geometry.setIndex(indexAttribute);
}

export function addGeometryToPhysics(world, rigidbodyDesc, object3d) {
    const rigidBody = world.createRigidBody(rigidbodyDesc)
    const { vertices, indexes } = getGeometryPoints(object3d)
    const shape = RAPIER.ColliderDesc.trimesh(vertices, indexes)
    world.createCollider(shape, rigidBody)
    return rigidBody
}

// CustomTimer class
export class CustomTimer extends Timer {
    constructor() {
        super()
    }

    resetAll = () => {
        this._startTime = performance.now();
        this._previousTime = 0;
        this._currentTime = 0;
        this._elapsed = 0;
        this._delta = 0;
    }
}