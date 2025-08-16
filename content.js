// content.js

// Use a Map to associate AudioContexts and GainNodes with video elements
const audioState = new Map();

function getOrCreateAudioState(video) {
    if (audioState.has(video)) {
        return audioState.get(video);
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(video);
    const gainNode = audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    const state = { audioContext, source, gainNode };
    audioState.set(video, state);
    return state;
}

function applyVolumeToVideos(volume) {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        try {
            // Ensure video is not muted by user
            if (volume > 0) {
                video.muted = false;
            }

            // Use Web Audio API for volume > 100%
            const { gainNode } = getOrCreateAudioState(video);
            gainNode.gain.value = volume;

        } catch (error) {
            console.error('Video Volume Controller Error:', error);
            // Fallback for videos that don't work with Web Audio API
            video.volume = Math.min(1, volume);
        }
    });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setVolume') {
        applyVolumeToVideos(request.volume);
        sendResponse({ success: true });
    }
    return true;
});

// Apply volume to new videos added to the page
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.tagName === 'VIDEO') {
                // Request volume from background and apply
                chrome.runtime.sendMessage({ action: 'getVolume' }, response => {
                    if (chrome.runtime.lastError) {
                        // console.error(chrome.runtime.lastError.message);
                    } else if (response && typeof response.volume === 'number') {
                        applyVolumeToVideos(response.volume);
                    }
                });
            } else if (node.querySelectorAll) {
                const videos = node.querySelectorAll('video');
                if (videos.length > 0) {
                    chrome.runtime.sendMessage({ action: 'getVolume' }, response => {
                         if (chrome.runtime.lastError) {
                            // console.error(chrome.runtime.lastError.message);
                        } else if (response && typeof response.volume === 'number') {
                            applyVolumeToVideos(response.volume);
                        }
                    });
                }
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

// Request initial volume when the script loads
// This ensures that when the content script is injected, it gets the correct volume
chrome.runtime.sendMessage({ action: 'getVolume' }, response => {
    if (chrome.runtime.lastError) {
        // console.error(chrome.runtime.lastError.message);
    } else if (response && typeof response.volume === 'number') {
        applyVolumeToVideos(response.volume);
    }
});
