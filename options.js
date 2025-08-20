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