/* Candy Magic Royale — Character Portrait Animator
 * Replaces the legacy primitive sphere/cylinder 3D rig (which hid the real portraits
 * and allocated a redundant WebGL context on mobile). Now animates the high-res
 * Egyptian Fantasy Queen Luma portrait cleanly and coordinates with Dragon3DCharacter.
 */
(() => {
  "use strict";
  if (window.__CMR_CHARACTER_ANIM_V2__) return;
  window.__CMR_CHARACTER_ANIM_V2__ = true;

  function triggerQueenState(className, durationMs = 950) {
    const queen = document.getElementById("queen");
    if (!queen) return;
    queen.classList.remove("combo-1", "combo-2", "combo-3", "celebrate", "defeat");
    void queen.offsetWidth;
    queen.classList.add(className);
    if (durationMs > 0) {
      clearTimeout(queen.__cmrTimer);
      queen.__cmrTimer = setTimeout(() => {
        queen.classList.remove(className);
      }, durationMs);
    }
  }

  window.CMRCharacters = {
    combo(chain) {
      const tier = chain >= 3 ? "combo-3" : chain === 2 ? "combo-2" : "combo-1";
      triggerQueenState(tier, 950);
      window.Dragon3DCharacter?.playCelebrate?.();
    },
    celebrate() {
      triggerQueenState("celebrate", 2200);
      window.Dragon3DCharacter?.playCelebrate?.();
    },
    defeat() {
      triggerQueenState("defeat", 1600);
      window.Dragon3DCharacter?.playIdle?.();
    },
    reset() {
      const queen = document.getElementById("queen");
      if (queen) queen.classList.remove("combo-1", "combo-2", "combo-3", "celebrate", "defeat");
      window.Dragon3DCharacter?.playIdle?.();
    },
  };
})();