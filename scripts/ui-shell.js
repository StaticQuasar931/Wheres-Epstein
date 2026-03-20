// Where's Epstein?
// Where's Epstein?

const UI_SHELL_FRAGMENT_PATH = "fragments/ui-shell.html";

export async function loadUiShell() {
  if (document.getElementById("menuToast")) {
    return;
  }

  const mount = document.getElementById("uiShellMount");
  if (!mount) {
    throw new Error("Missing UI shell mount point.");
  }

  const response = await fetch(UI_SHELL_FRAGMENT_PATH, {
    credentials: "same-origin",
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${UI_SHELL_FRAGMENT_PATH}: ${response.status}`);
  }

  const markup = await response.text();
  mount.innerHTML = markup;
}
