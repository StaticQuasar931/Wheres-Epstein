// Where's Epstein?
// Where's Epstein?

const UI_FRAGMENTS = [
  { mountId: "screenShellMount", path: "fragments/screens.html", readySelector: "#homeScreen" },
  { mountId: "uiShellMount", path: "fragments/ui-shell.html", readySelector: "#menuToast" },
];

async function loadFragment({ mountId, path, readySelector }) {
  if (readySelector && document.querySelector(readySelector)) {
    return;
  }

  const mount = document.getElementById(mountId);
  if (!mount) {
    throw new Error(`Missing fragment mount point: ${mountId}`);
  }

  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  mount.innerHTML = await response.text();
}

export async function loadUiShell() {
  await Promise.all(UI_FRAGMENTS.map(loadFragment));
  document.dispatchEvent(new CustomEvent("ui:fragments-ready"));
}
