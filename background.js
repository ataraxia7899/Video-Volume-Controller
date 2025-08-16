// background.js

// Store volumes in memory for quick access
const tabVolumes = {};

// Get stored volume for a tab, defaulting to 100%
async function getVolumeForTab(tabId) {
  if (tabVolumes[tabId]) {
    return tabVolumes[tabId];
  }
  const result = await chrome.storage.local.get(tabId.toString());
  const volume = result[tabId.toString()] !== undefined ? result[tabId.toString()] : 1.0;
  tabVolumes[tabId] = volume;
  return volume;
}

// Set volume for a tab and apply it to the content script
async function setVolumeForTab(tabId, volume) {
  // Clamp volume between 0 and 3
  const clampedVolume = Math.max(0, Math.min(3, volume));
  tabVolumes[tabId] = clampedVolume;
  await chrome.storage.local.set({ [tabId.toString()]: clampedVolume });

  // Send the new volume to the content script
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'setVolume',
      volume: clampedVolume,
    });
  } catch (error) {
    // This can happen if the content script is not injected on the page
    // (e.g., chrome:// pages, file URLs, etc.)
    // We can safely ignore this error.
    if (error.message.includes('Receiving end does not exist')) {
        // console.log(`Content script not available on tab ${tabId}.`);
    } else {
        // console.error(`Error sending message to tab ${tabId}:`, error);
    }
  }
}

// Message listener for popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Use an async function to handle promises
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
        // We don't need to check for URL validity here because
        // setVolumeForTab already handles errors gracefully.
        if (tab.id) {
          await setVolumeForTab(tab.id, volume);
        }
      }
      sendResponse({ success: true });
    }
  })();
  // Return true to indicate that the response is sent asynchronously
  return true;
});

// When a tab is updated, re-apply the stored volume
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    (async () => {
      const volume = await getVolumeForTab(tabId);
      if (volume !== 1.0) { // Only set if not default
        await setVolumeForTab(tabId, volume);
      }
    })();
  }
});

// When a tab is removed, clean up its stored volume
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabVolumes[tabId];
  chrome.storage.local.remove(tabId.toString());
});