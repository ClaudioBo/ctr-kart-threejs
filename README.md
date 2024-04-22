# ctr-kart-threejs

Small testing project on `Three.js` where I'll try to recreate how [Crash Team Racing (PSX)](https://en.wikipedia.org/wiki/Crash_Team_Racing) shows their Kart tire sprites, smoke effects, and turbo effect.

I'm also trying out `Three.js` so I can learn 😂

## Resources

-   Kart model downloaded from [The Models Resource](https://www.models-resource.com/playstation/crashteamracing/model/61792/), thanks to [CTR-Tools by DCxDemo\*](https://github.com/CTR-tools/CTR-tools).
-   Tire spritesheet ripped by me and uploaded to [The Spriters Resource](https://www.spriters-resource.com/playstation/ctr/sheet/116430/).
-   Kart smoke spritesheet ripped by me and yet needs to be uploaded to **The Spriters Resource**.
-   Kart shadow texture ripped by me and yet needs to be uploaded to **The Spriters Resource**.
-   Kart sounds ripped by [DCxDemo\* with CTR-Tools ](https://github.com/CTR-tools/CTR-tools).
-   Kart turbo model ripped by [DCxDemo\* with CTR-Tools ](https://github.com/CTR-tools/CTR-tools). Slightly modified by me

## Live example

https://www.claudiobo.com/ctr-kart-threejs

## Summary of Research Findings

### **Tires**

1. **Number of Sprites:** There are 17 sprites stored in the PSX VRAM.  
   ![Tire spritesheet](/assets/img/tire-spritesheet.png)

2. **Animation Details:** The sprite animation consists of 17 frames, depicting a pre-rendered tire panning from 0° to 90°.

3. **Animation Playback:** The sprite animation should be played normally until the Camera X angle exceeds 90°, when reached it should be played backwards until 180°, also the playback gets affected by the Camera Y angle relative to the tire

4. **Sprite Mirroring:** When the camera angle exceeds 180°, the sprite is mirrored

5. **Sprite Rotation:** The sprite rotation is based on the difference of the Camera Z rotation and Tire Z rotation converted to degrees

    > **NOTE:** Both calculation and description may be inaccurate

6. **Color Palette Modification:** The tire's color palette undergoes a slight darkening to simulate forward motion, with the flicker ratio determined by the kart's velocity.

### **Exhaust smoke**

1. **Number of Sprites:** There are 6 sprites stored in the PSX VRAM.  
   ![Smoke spritesheet](/assets/img/smoke-spritesheet-original.png)

    > **NOTE:** I'm not 100% sure about the last frame tho.

2. **Animation Details:** The sprite animation consists of 6 frames, depicting a smoke fading out

3. **Animation Playback:** Even if there are 6 frames, only the first frame is always played for the Kart's exhaust, the full animation playback are used on other unrelated effects.

4. **Sprite Rotation:** Smoke rotates randomly, both spawned smoke particles share the same random rotation speed

    > **NOTE:** The rotation range used in my code may be inaccurate, I just dropped a random range and tried to match it side-by-side with the game

5. **Spawn Rate:** Let's remember that the game runs 30FPS, smoke particles appears every frame  
   `1 frame / 30 fps = 0.0333333333333333ms`

6. **Particle Life Time:** Smoke particles duration are 5 frames  
   `5 frame / 30 fps = 0.1666666666666667ms`

    > [Also confirmed on the decompiled code](https://github.com/CTR-tools/CTR-ModSDK/blob/3402c41c642cf3ec0f119e9e95bca791567a69f1/decompile/General/zGlobal_DATA.c#L7720)

7. **Particle Blending Mode:** The sprite rendered blending mode is Additive, when sliding it changes to Subtractive

8. **Particle Spreading:** The smoke horizontal direction is randomized, both spawned smoke particles share the same random horizontal direction

    > **NOTE:** The horizontal direction range used in my code may be inaccurate, I just dropped a random range and tried to match it side-by-side with the game

9. **Particle Scaling:** The smoke scale starts a little bit small, and depending on its lifetime gets a little bit higher

    > **NOTE:** The scaling range used in my code may be inaccurate, I just dropped a random range and tried to match it side-by-side with the game

## To-do list

-   [x] Change sprite depending on camera's view based on horizontal axis
-   [x] Change sprite depending on tire object rotation
-   [x] Import Crash Kart model
-   [x] Change sprite depending on camera's view based on vertical axis
-   [x] Implement Smoke with togglable darkness and toggable visibility
-   [x] Implement Turbo animation
-   [x] Find a way to render the ctr models correctly without maxing heavily out the ambient light intensity &mdash; solution was multiplying all vertex colors by 4
-   [ ] Implement basic physics
    -   [x] Add `ground/dirt` model
    -   [x] Add `wall` model
    -   [ ] Make kart move
    -   [ ] Make kart jump
    -   [ ] Try to imitate original game by getting RAM values and constants
-   [ ] Implement some sort of basic speed, and acceleration just to be able to implement the next list of TO-DO chores
    -   [x] Implement Tire's color palette modification to simulate forward motion
    -   [x] Implement Kart sounds
    -   [ ] Implement Turbo different scales depending on the 3 consecutive turbos
-   [ ] Implement skid effect
-   [x] Make camera follow player
-   [ ] Make camera distance dynamic
-   [x] Make camera toggle between close and far distance mode
-   [x] Make camera toggle reverse mirror mode
-   [x] Implement model rotation when accelerating
-   [x] Implement front tire rotation when steering
-   [ ] Implement sliding mechanics
-   [ ] Implement reserves
-   [ ] Implement fire level

## Run server

First you need to install the libraries

```bash
npm i
```

Once installed, you can run the server now

```bash
npx vite
```
