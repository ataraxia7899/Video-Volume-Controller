// background.js

const tabVolumes = {}; // In-memory cache for volumes
const capturingTabs = new Set(); // Set of tabs currently being captured

// --- Startup State Synchronization ---

(async () => {
    try {
        const capturedTabsInfo = await chrome.tabCapture.getCapturedTabs();
        for (const info of capturedTabsInfo) {
            if (info.tabId) {
                capturingTabs.add(info.tabId);
            }
        }
    } catch (error) {
        console.error("Error getting captured tabs on startup:", error);
    }
})();


// --- Offscreen Document Management ---

let creatingOffscreenDocument = null; // Promise to prevent race conditions

async function hasOffscreenDocument() {
    if (chrome.runtime.getManifest().manifest_version < 3) {
        return false;
    }
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
        if (client.url.endsWith('/offscreen.html')) {
            return true;
        }
    }
    return false;
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        return;
    }
    if (creatingOffscreenDocument) {
        await creatingOffscreenDocument;
        return;
    }

    creatingOffscreenDocument = chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'To process audio from tab capture'
    });

    try {
        await creatingOffscreenDocument;
    } finally {
        creatingOffscreenDocument = null;
    }
}

// --- Volume and Capture Logic ---

async function getVolumeForTab(tabId) {
    if (tabId in tabVolumes) {
        return tabVolumes[tabId];
    }
    const result = await chrome.storage.local.get(tabId.toString());
    const volume = result[tabId.toString()] ?? 1.0;
    tabVolumes[tabId] = volume;
    return volume;
}

async function setVolumeForTab(tabId, volume) {
    const clampedVolume = Math.max(0, Math.min(3, volume));
    tabVolumes[tabId] = clampedVolume;
    await chrome.storage.local.set({ [tabId.toString()]: clampedVolume });

    await setupOffscreenDocument();

    if (capturingTabs.has(tabId)) {
        chrome.runtime.sendMessage({
            action: 'set-volume',
            tabId: tabId,
            volume: clampedVolume
        });
    } else {
        try {
            const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
            chrome.runtime.sendMessage({
                action: 'start-capture',
                tabId: tabId,
                streamId: streamId,
                volume: clampedVolume
            });
            capturingTabs.add(tabId);
        } catch (error) {
            if (error.message.includes('Cannot capture a tab with an active stream')) {
                console.warn(`Correcting stale capture state for tab ${tabId}`);
                capturingTabs.add(tabId); // Correct the state
                chrome.runtime.sendMessage({ // And just set the volume
                    action: 'set-volume',
                    tabId: tabId,
                    volume: clampedVolume
                });
            } else {
                console.error(`Could not capture tab ${tabId}:`, error);
            }
        }
    }
}

// --- Event Listeners ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        if (request.action === 'getVolume') {
            const tabId = sender.tab ? sender.tab.id : request.tabId;
            if (tabId) {
                const volume = await getVolumeForTab(tabId);
                sendResponse({ volume });
            }
        } else if (request.action === 'setVolume') {
            const { tabId, volume } = request;
            if (tabId) {
                await setVolumeForTab(tabId, volume);
                sendResponse({ success: true });
            }
        } else if (request.action === 'applyToAllTabs') {
            const { volume } = request;
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
                    await setVolumeForTab(tab.id, volume);
                }
            }
            sendResponse({ success: true });
        }
    })();
    return true; // To indicate async response
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (capturingTabs.has(tabId)) {
        chrome.runtime.sendMessage({ action: 'stop-capture', tabId: tabId });
        capturingTabs.delete(tabId);
    }
    delete tabVolumes[tabId];
    chrome.storage.local.remove(tabId.toString());
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && capturingTabs.has(tabId)) {
        (async () => {
            try {
                // First, stop the previous stream to prevent errors.
                await new Promise(resolve => chrome.runtime.sendMessage({ action: 'stop-capture', tabId: tabId }, resolve));

                // Now, recapture with the stored volume.
                const volume = await getVolumeForTab(tabId);
                const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
                
                await setupOffscreenDocument();
                chrome.runtime.sendMessage({
                    action: 'start-capture',
                    tabId: tabId,
                    streamId: streamId,
                    volume: volume
                });
            } catch (error) {
                console.error(`Could not re-capture tab ${tabId} after update:`, error);
                capturingTabs.delete(tabId); // Clean up state on failure
            }
        })();
    }
});