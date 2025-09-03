// content.js

const audioState = new Map();
let pageAudioContext = null;

function getPageAudioContext() {
    if (!pageAudioContext) {
        try {
            pageAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Video Volume Controller: Could not create AudioContext.", e);
            return null;
        }
    }
    return pageAudioContext;
}

async function getOrCreateAudioState(video) {
    if (audioState.has(video)) {
        return await audioState.get(video);
    }

    const promise = new Promise((resolve, reject) => {
        const setup = () => {
            const audioContext = getPageAudioContext();
            if (!audioContext) {
                resolve({});
                return;
            }

            try {
                const source = audioContext.createMediaElementSource(video);
                const gainNode = audioContext.createGain();
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                const state = { source, gainNode };
                audioState.set(video, state);
                resolve(state);
            } catch (error) {
                if (error.name === 'InvalidStateError') {
                    console.warn('Video Volume Controller: Video element is already in use. The extension will not control this video.');
                    resolve({ inUse: true });
                } else {
                    reject(error);
                }
            }
        };

        if (video.readyState >= 1) {
            setup();
        } else {
            video.addEventListener('loadedmetadata', setup, { once: true });
            video.addEventListener('error', (e) => reject(new Error('Video element error')), { once: true });
        }
    });

    audioState.set(video, promise);
    return promise;
}

async function applyVolumeToVideos(volume) {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
        // Heuristic: If a video is set to autoplay and is muted by default in the HTML,
        // assume the page has its own logic for it. Leave it alone.
        if (video.hasAttribute('autoplay') && video.defaultMuted) {
            continue;
        }

        let state;
        try {
            state = await getOrCreateAudioState(video);
        } catch (error) {
            console.error('Video Volume Controller: Failed to get audio state.', error);
            continue;
        }

        if (state && state.inUse) {
            continue;
        }

        if (state && state.gainNode) {
            try {
                if (volume > 0) {
                    video.muted = false;
                }
                state.gainNode.gain.value = volume;
            } catch (e) {
                console.error("VVC Error setting gain", e);
            }
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
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.tagName === 'VIDEO' || node.querySelector('video')) {
                newVideosFound = true;
                break;
            }
        }
        if (newVideosFound) break;
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
chrome.runtime.sendMessage({ action: 'getVolume' }, response => {
    if (chrome.runtime.lastError) {
        // console.error(chrome.runtime.lastError.message);
    } else if (response && typeof response.volume === 'number') {
        applyVolumeToVideos(response.volume);
    }
});
