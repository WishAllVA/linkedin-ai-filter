const DEFAULTS = { enabled: true, mode: 'hide', threshold: 2 };


function load() {
    chrome.storage.sync.get(DEFAULTS, cfg => {
        document.getElementById('enabled').checked = !!cfg.enabled;
        document.getElementById('mode').value = cfg.mode || 'hide';
        document.getElementById('threshold').value = Number(cfg.threshold || 2);
    });
    chrome.storage.local.get({ hiddenCount: 0 }, d => {
    document.getElementById('count').textContent = d.hiddenCount;
    });
}


function save() {
    const enabled = document.getElementById('enabled').checked;
    const mode = document.getElementById('mode').value;
    const threshold = Number(document.getElementById('threshold').value || 2);
    chrome.storage.sync.set({ enabled, mode, threshold });
}


document.getElementById('enabled').addEventListener('change', save);
['mode','threshold'].forEach(id => document.getElementById(id).addEventListener('change', save));


document.getElementById('openOptions').addEventListener('click', e => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});


document.addEventListener('DOMContentLoaded', load);