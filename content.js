const DEFAULT_PATTERNS = [
    // common ChatGPT-ish phrases & cliches
    /as (an|a) (ai )?\w+/i,
    /let's dive in/i,
    /in today's (fast[- ]paced|rapidly changing) world/i,
    /here (are|\'re're) (\d+|some) (tips|ways|lessons)/i,
    /(i'm|i am) excited to share/i,
    /actionable insights/i,
    /unleashing the power/i,
    /the future of work/i,
    /unlock(ing)? potential/i,
    /(embracing|leveraging) (ai|artificial intelligence)/i,
    /my (top|key) takeaways/i,
    /1\) .* 2\) .* 3\)/i, // numbered lists in one line
    /\b(i asked (chatgpt|gpt(-\d+)?) to)\b/i
];

const DEFAULT_CONFIG = {
    enabled: true,
    mode: 'hide',
    threshold: 1,
    patterns: DEFAULT_PATTERNS.map(r => r.source),
    whitelist: []
};


let cfg = { ...DEFAULT_CONFIG };
let hiddenCount = 0;

async function loadConfig() {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_CONFIG, items => {
      cfg = { ...DEFAULT_CONFIG, ...items };
      cfg._regexes = cfg.patterns.map(p => new RegExp(p, 'i'));
      resolve(cfg);
    });
  });
}

function markPost(post, score) {
  post.dataset.gptFiltered = '1';

  const label = document.createElement('div');
  label.className = 'gpt-filter-badge';
  label.textContent = `🤖 GPT-ish (${score})`;

  if (cfg.mode === 'hide') {
    post.classList.add('gpt-filter-hidden');
  } else if (cfg.mode === 'blur') {
    post.classList.add('gpt-filter-blur');
  }

  const header = post.querySelector('.feed-shared-update-v2__description-wrapper, header, .update-components-header');
  if (header) {
    header.prepend(label);
  } else {
    post.prepend(label);
  }
}

function isWhitelisted(post) {
  if (!cfg.whitelist || cfg.whitelist.length === 0) return false;

  const authorEl = post.querySelector('a[href*="linkedin.com/in/"], .feed-shared-actor__name, .update-components-actor__name');
  let authorText = '';
  if (authorEl) {
    authorText = (authorEl.innerText || authorEl.getAttribute('href') || '').toLowerCase();
  }

  return cfg.whitelist.some(entry => authorText.includes(entry.toLowerCase()));
}

function extractText(post) {
  if (!post) return "";
  let text = post.innerText || "";

  const altTexts = Array.from(post.querySelectorAll('[alt], [aria-label]'))
    .map(el => el.getAttribute("alt") || el.getAttribute("aria-label") || "")
    .join(" ");

  return (text + " " + altTexts).trim();
}

function textScore(text) {
    if (!text) return 0;
    let score = 0;
    if (!cfg._regexes) {
        cfg._regexes = cfg.patterns.map(p => new RegExp(p, 'i'));
    }
    for (const regex of cfg._regexes) {
        if (regex.test(text)) {
            score++;
        }
    }
    return score;
}

function considerPost(post) {
    if (!cfg.enabled) return;
    if (!post || post.dataset.gptChecked) return;
    post.dataset.gptChecked = '1';


    if (isWhitelisted(post)) return;
    const text = extractText(post);
    const score = textScore(text);
    if (score >= Number(cfg.threshold || 1)) {
        markPost(post, score);
    }
}


function scanAll() {
    const candidates = document.querySelectorAll('article, div.feed-shared-update-v2, div[data-urn^="urn:li:activity:"]');
    candidates.forEach(considerPost);
}


async function init() {
    await loadConfig();
    if (!cfg.enabled) return;

    scanAll();

    const obs = new MutationObserver(muts => {
        for (const m of muts) {
            m.addedNodes && m.addedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                if (node.matches && (node.matches('article, div.feed-shared-update-v2, div[data-urn^="urn:li:activity:"]'))) {
                    considerPost(node);
                } else {
                    node.querySelectorAll && node.querySelectorAll('article, div.feed-shared-update-v2, div[data-urn^="urn:li:activity:"]')
                    .forEach(considerPost);
                }
            });
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });


    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        let needsRescan = false;
        if (changes.enabled) cfg.enabled = changes.enabled.newValue;
        if (changes.mode) cfg.mode = changes.mode.newValue;
        if (changes.threshold) cfg.threshold = changes.threshold.newValue;
        if (changes.patterns) {
            cfg.patterns = changes.patterns.newValue;
            cfg._regexes = cfg.patterns.map(p => new RegExp(p, 'i'));
            needsRescan = true;
        }
        if (changes.whitelist) cfg.whitelist = changes.whitelist.newValue;


        if (cfg.enabled && needsRescan) {
            document.querySelectorAll('[data-gpt-checked]')?.forEach(el => {
            el.removeAttribute('data-gpt-checked');
            el.removeAttribute('data-gpt-filtered');
            el.classList.remove('gpt-filter-hidden', 'gpt-filter-blur');
            const badge = el.querySelector('.gpt-filter-badge');
            if (badge) badge.remove();
            });
            scanAll();
        }
    });
}


init();