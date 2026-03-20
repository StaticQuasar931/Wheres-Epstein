// Where's Epstein?
// Where's Epstein?

import { HiddenObjectGame } from "./game.js";
import { loadUiShell } from "./ui-shell.js";

window.addEventListener("load", async () => {
  await loadUiShell();
  new HiddenObjectGame();
});
