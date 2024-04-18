import KartAssets from '../assets/kartAssets.js'

export default class AssetsManager {
    constructor() {
        this.kartAssets;
    }

    async loadAssets() {
        this.kartAssets = new KartAssets()
        await this.kartAssets.loadAssets()
    }
}