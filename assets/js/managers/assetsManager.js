import KartAssets from '../assets/kartAssets.js'
import TrackAssets from '../assets/trackAssets.js'

export default class AssetsManager {
    constructor() {
        this.kartAssets;
        this.trackAssets;
    }

    async loadAssets() {
        this.kartAssets = new KartAssets()
        await this.kartAssets.loadAssets()
        this.trackAssets = new TrackAssets()
        await this.trackAssets.loadAssets()
    }
}