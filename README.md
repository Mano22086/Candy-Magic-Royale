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
- Four-match striped candy and five-match rainbow candy; special candies are now awarded only for a real contiguous run, not the combined size of separate matches.
- Dead boards automatically reshuffle after a move, and shuffling keeps existing special candies.
- Hammer clears now show a burst, refill the cell, and resolve any resulting cascades.
- End-of-level scoring now awards one, two, or three stars using score thresholds; failed levels lock input until retry.
- Hammer, shuffle and +5 moves boosters. Hammer now consumes a move; shuffle searches for a match-free board with at least one legal move.
- Queen Luma and Dragon Prince currently use animated SVG artwork, not 3D character rigs.
- Local progress restores the current level target, move allowance, coins and stars after reload.
- Candy core materials are shared by type to reduce GPU material allocations; burst particle materials are disposed after animation.
- Special-candy swaps support color+color, striped+striped, and color+striped combinations.

## Visual rebuild status
The current milestone integrates the collected candy artwork into the 3D board and improves high-DPI rendering and tone mapping. The world illustrations, obstacle art, booster art, and character concepts are available in `assets/` but are not all integrated into gameplay yet.

JavaScript syntax validation has passed. Real-device visual testing in an Android browser is still pending. The next visual milestones are true 3D character models/animation, richer world scenes, obstacle and booster integration, and device performance testing. Sound and Android packaging are also still pending.
