# Cartoon UI Pack: free sample

A free taste of the Cartoon UI Pack: 14 UI pieces and 10 icons (also as 10 white icons), all in 1x and 2x (icons also 4x). The full packs have far more: Small (USD 10), Medium (USD 20) and Big (USD 40), see the store page.

**AI disclosure (Graphics, Code):** the art was created with AI image generation and cut, cleaned and composed by code.

## What is inside

- 14 UI pieces: `bar_fill_lime`, `bar_fill_red`, `bar_frame`, `btn_close_round`, `btn_round_orange`, `btn_wide_lime`, `coin_plate`, `inner_panel`, `ribbon_long_orange`, `slot_empty`, `title_plate`, `toggle_off`, `toggle_on`, `window_frame_red`. 6 of them have 5 states (normal, hover, pressed, disabled, focused).
- 9 stretchable pieces with 9-slice margins in `nine_slice.json`.
- 10 coloured icons and the same 10 as white icons.
- Progress bars: `bar_frame`, `bar_fill_lime`, `bar_fill_red`, and the lime bar at 0, 25, 50, 75 and 100 percent in `bars_composed/`.

## Files

`UI/default/<1x|2x>/<category>/<piece>_<state>.png`, `Icons/Color|White/<1x|2x|4x>/<folder>/<icon>.png`. 1x is exactly half of 2x; 2x is for a 1080 px wide portrait screen. Stretch the panels, plates and the wide button with the margins in `nine_slice.json` (left, top, right, bottom in file pixels): in Godot use a `NinePatchRect` or `StyleBoxTexture`, in Unity the Sprite Editor border (left, bottom, right, top).

## Tested with

The PNG files of this sample are the same files as in the Medium and Big packs, whose demo project was tested in Godot 4.7.2. The sample itself contains no project and was not imported into an engine. Unity and web steps were not run.

## Licence

See `LICENSE.txt`. Free for your own commercial and non-commercial products; no resale or redistribution of the assets; no machine-learning training. Credit is appreciated.
