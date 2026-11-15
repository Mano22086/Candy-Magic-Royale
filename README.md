# Candy Magic Royale

A mobile-first Babylon.js 3D match-three game.

## Run
Open the GitHub Pages site or serve this repository through a static web server. Babylon.js is loaded from its CDN, so the game needs an internet connection.

## Current rebuild
- Mobile-first royal kingdom interface.
- Babylon.js 3D board with 3D candy cores, glossy candy artwork sprites, lighting and glow.
- Six candy artwork textures are loaded from the collected asset pack; their flat background is keyed to transparency at runtime.
- Tap or swipe neighboring candies to swap them.
- Match three or more, cascade gravity, refill and score.
- Four-match striped candy and five-match rainbow candy.
- Hammer, shuffle and +5 moves boosters.
- Queen Luma and Dragon Prince currently use animated SVG artwork, not 3D character rigs.
- Local progress for level, coins and stars.

## Visual rebuild status
The current milestone integrates the collected candy artwork into the 3D board and improves high-DPI rendering and tone mapping. The world illustrations, obstacle art, booster art, and character concepts are available in `assets/` but are not all integrated into gameplay yet.

The game has passed a JavaScript syntax check, but has not yet been visually tested in a real mobile browser. The next visual milestones are true 3D character models/animation, richer world scenes, obstacle and booster integration, and device performance testing. Sound and Android packaging are also still pending.
