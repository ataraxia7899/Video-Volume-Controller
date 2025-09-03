// content.js

// Use a Map to associate AudioContexts and GainNodes with video elements
const audioState = new Map();

async function getOrCreateAudioState(video) {
    if (audioState.has(video)) {
        return await audioState.get(video);
    }

    const promise = new Promise((resolve, reject) => {
        const setup = () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaElementSource(video);
                const gainNode = audioContext.createGain();
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                const state = { audioContext, source, gainNode };
                audioState.set(video, state);
                resolve(state);
            } catch (error) {
                console.error('Video Volume Controller: Error creating audio context.', error);
                reject(error);
            }
        };

        if (video.readyState >= 1) { // HAVE_METADATA
            setup();
        } else {
            video.addEventListener('loadedmetadata', setup, { once: true });
            video.addEventListener('error', (e) => {
                console.error('Video Volume Controller: Video element error.', e);
                reject(new Error('Video element error'));
            }, { once: true });
        }
    });

    audioState.set(video, promise);
    return promise;
}

async function applyVolumeToVideos(volume) {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
        try {
            // Ensure video is not muted by user
            if (volume > 0) {
                video.muted = false;
            }

            // Use Web Audio API for volume > 100%
            const state = await getOrCreateAudioState(video);
            if (state && state.gainNode) {
                state.gainNode.gain.value = volume;
            }

        } catch (error) {
            console.error('Video Volume Controller Error:', error);
            // Fallback for videos that don't work with Web Audio API
            video.volume = Math.min(1, volume);
        }
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setVolume') {
        (async () => {
            await applyVolumeToVideos(request.volume);
            sendResponse({ success: true });
        })();
    }
    return true;
});

// Apply volume to new videos added to the page
const observer = new MutationObserver(mutations => {
    let newVideosFound = false;
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            // We only care about element nodes
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            if (node.tagName === 'VIDEO' || node.querySelector('video')) {
                newVideosFound = true;
                break; // Exit inner loop
            }
        }
        if (newVideosFound) break; // Exit outer loop
    }

    if (newVideosFound) {
        chrome.runtime.sendMessage({ action: 'getVolume' }, response => {
            if (chrome.runtime.lastError) {
                // console.error(chrome.runtime.lastError.message);
            } else if (response && typeof response.volume === 'number') {
                applyVolumeToVideos(response.volume);
            }
        });
    }
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