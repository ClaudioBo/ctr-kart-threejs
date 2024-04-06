# ctr-kart-threejs

Small testing project on `Three.js` where I'll try to recreate how [Crash Team Racing (PSX)](https://en.wikipedia.org/wiki/Crash_Team_Racing) shows their Kart tire sprites, smoke effect, and turbo effect.

I'm also trying out `Three.js` so I can learn 😂

## Resources

-   Kart model downloaded from [The Models Resource](https://www.models-resource.com/playstation/crashteamracing/model/61792/), thanks to [CTR-Tools by DCxDemo\*](https://github.com/CTR-tools/CTR-tools).
-   Tire spritesheet ripped by me and uploaded to [The Spriters Resource](https://www.spriters-resource.com/playstation/ctr/sheet/116430/).
-   Kart smoke spritesheet ripped by me and yet needs to be uploaded to **The Spriters Resource**.

<!-- - Kart sounds ripped by [DCxDemo\* with CTR-Tools ](https://github.com/CTR-tools/CTR-tools).   -->
<!-- - Kart turbo model ripped by [DCxDemo\* with CTR-Tools ](https://github.com/CTR-tools/CTR-tools). Slightly modified by me   -->

## Live example

https://www.claudiobo.com/ctr-kart-threejs

## Summary of Research Findings

1. **Number of Sprites:** There are 17 sprites stored in the PSX VRAM.  
   ![Tire spritesheet](/assets/img/tire-spritesheet.png)

1. **Animation Details:** The sprite animation consists of 17 frames, depicting a pre-rendered tire panning from 0° to 90°.

1. **Animation Playback:** The sprite animation should be played normally until the camera angle exceeds 90°, when reached it should be played backwards until 180°

1. **Sprite Mirroring:** When the camera angle exceeds 180°, the sprite is mirrored

1. **Sprite Rotation:** Further investigation is required to understand how the tires frame selection and rotation are affected when the camera angle is above or below the tire.

1. **Color Palette Modification:** The tire's color palette undergoes a slight darkening to simulate forward motion, with the flicker ratio determined by the kart's velocity.

## To-do list

-   [x] Change sprite depending on camera's view based on horizontal axis
-   [x] Change sprite depending on tire object rotation
-   [x] Import Crash Kart model
-   [x] Change sprite depending on camera's view based on vertical axis
-   [ ] Find a way to render the kart model correctly without maxing out the ambient light intensity
-   [ ] Implement Smoke with togglable darkness and toggable visibility
-   [ ] Implement Turbo animation
-   [ ] Implement Tire's color palette modification to simulate forward motion
-   [ ] Implement Kart sounds

## Run server

First you need to install the libraries

```bash
npm i
```

Once installed, you can run the server now

```bash
npx vite
```
