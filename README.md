# wheel-billboard-three-js-testing

Small testing project on `Three.js` where I'll try to recreate how [Crash Team Racing (PSX)](https://en.wikipedia.org/wiki/Crash_Team_Racing) shows their Kart wheel sprites.

I'm also trying out `Three.js` so I can learn 😂

Kart model downloaded from [The Models Resource](https://www.models-resource.com/playstation/crashteamracing/model/61792/), thanks to [CTR-Tools by DCxDemo\*](https://github.com/CTR-tools/CTR-tools).  
Wheel sprites ripped by me and uploaded to [The Spriters Resource](https://www.spriters-resource.com/playstation/ctr/sheet/116430/)

## Summary of Research Findings

1. **Number of Sprites:** There are 16 sprites stored in the PSX VRAM.  
   ![Wheel spritesheet](/assets/img/wheel-spritesheet.png)

2. **Animation Details:** The sprite animation consists of 16 frames, depicting a pre-rendered wheel panning from 0° to 90°.

3. **Rotation Behavior:** If the camera viewing angle of the wheel exceeds 90°, the sprite rotates 180°, and the animation plays in reverse.

4. **Seamless Rotation Transition:** To ensure smoother rotation, the sprite begins rotating slightly earlier before reaching the 90° mark from the camera's perspective.

5. **Additional Rotation and Mirroring:** When the camera angle exceeds 180°, the sprite is mirrored, and the aforementioned rules apply.

6. **Effects of Camera Angle:** Further investigation is required to understand how the wheel's frame selection and rotation are affected when the camera angle is above or below the wheel.

7. **Color Palette Modification:** The wheel's color palette undergoes a slight darkening to simulate forward motion, with the flicker ratio determined by the kart's velocity.

## To-do list

-   [x] Change sprite depending on camera's view based on horizontal axis
-   [x] Change sprite depending on wheel object rotation
-   [x] Import Crash Kart model
-   [ ] Somehow implement to the rendered how PSX renders their vertex colors for the current kart model
-   [ ] Change sprite depending on camera's view based on vertical axis

## Install dependencies

```bash
npm i
```

## Run server

```bash
npx vite
```
