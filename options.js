const DEFAULTS = {
  enabled: true,
  mode: 'hide',
  threshold: 1,
  patterns: [
    'as (an|a) (ai )?\\w+',
    "let's dive in",
    "in today's (fast[- ]paced|rapidly changing) world",
    "here (are|'re) (\\d+|some) (tips|ways|lessons)",
    "(i'm|i am) excited to share",
    'actionable insights',
    'unleashing the power',
    'the future of work',
    'unlock(ing)? potential',
    '(embracing|leveraging) (ai|artificial intelligence)',
    'my (top|key) takeaways',
    '1\\) .* 2\\) .* 3\\)',
    '\\b(i asked (chatgpt|gpt(-\\d+)?) to)\\b'
  ],
  whitelist: []
};

function load() {
  chrome.storage.sync.get(DEFAULTS, cfg => {
    document.getElementById('enabled').checked = !!cfg.enabled;
    document.getElementById('mode').value = cfg.mode || 'hide';
    document.getElementById('threshold').value = Number(cfg.threshold || 2);
    document.getElementById('patterns').value = (cfg.patterns || DEFAULTS.patterns).join('\n');
    document.getElementById('whitelist').value = (cfg.whitelist || []).join('\n');
  });
}

function save() {
  const enabled = document.getElementById('enabled').checked;
  const mode = document.getElementById('mode').value;
  const threshold = Number(document.getElementById('threshold').value || 2);
  const patterns = document.getElementById('patterns').value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const whitelist = document.getElementById('whitelist').value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  chrome.storage.sync.set({ enabled, mode, threshold, patterns, whitelist }, () => {
    const el = document.getElementById('status');
    el.textContent = 'Saved';
    setTimeout(() => (el.textContent = ''), 1200);
  });
}

document.getElementById('save').addEventListener('click', save);
document.addEventListener('DOMContentLoaded', load);

document.getElementById("importSettings").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", (event) => {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      chrome.storage.sync.set(importedData, () => {
        alert("Settings imported successfully!");
        location.reload(); // reload options page so fields update
      });
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});

document.getElementById("exportSettings").addEventListener("click", () => {
  chrome.storage.local.get(null, (localData) => {
    chrome.storage.sync.get(null, (syncData) => {
      const allData = { ...localData, ...syncData };

      const jsonStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "linkedin-ai-filter-settings.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });
});