import { defineConfig } from 'vite'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    base: '',
    plugins: [
        wasm(),
        topLevelAwait()
    ],
    worker: {
        plugins: [
            wasm(),
            topLevelAwait()
        ]
    },
    build: {
        minify: false,
    },
    rollupOptions: {
        external: [
            "@dimforge/rapier3d-compat",
        ],
    }
})