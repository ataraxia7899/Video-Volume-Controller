const audioState = new Map();
let pageAudioContext = null;
let currentVolume = 1.0;

// --- AudioContext Management ---

function resumeAudioContextIfNeeded() {
    if (pageAudioContext && pageAudioContext.state === 'suspended') {
        pageAudioContext.resume().catch((e) => console.error('VVC: AudioContext resume failed.', e));
    }
}

function getPageAudioContext() {
    if (!pageAudioContext) {
        try {
            pageAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const resumeEvents = ['click', 'keydown', 'scroll', 'touchstart'];
            resumeEvents.forEach((eventName) => {
                document.addEventListener(eventName, resumeAudioContextIfNeeded, { once: true });
            });
        } catch (e) {
            console.error('VVC: Could not create AudioContext.', e);
            return null;
        }
    }
    return pageAudioContext;
}

async function getOrCreateAudioState(mediaElement) {
    if (audioState.has(mediaElement)) {
        const state = audioState.get(mediaElement);
        return state instanceof Promise ? await state : state;
    }

    const promise = new Promise((resolve, reject) => {
        const setup = () => {
            const audioContext = getPageAudioContext();
            if (!audioContext) {
                resolve({});
                return;
            }
            try {
                const source = audioContext.createMediaElementSource(mediaElement);
                const gainNode = audioContext.createGain();
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                const state = { source, gainNode };
                audioState.set(mediaElement, state);
                resolve(state);
            } catch (error) {
                if (error.name === 'InvalidStateError') {
                    const state = { inUse: true };
                    audioState.set(mediaElement, state);
                    resolve(state);
                } else {
                    audioState.delete(mediaElement);
                    reject(error);
                }
            }
        };

        if (mediaElement.readyState >= 1) {
            setup();
        } else {
            mediaElement.addEventListener('loadedmetadata', setup, { once: true });
            mediaElement.addEventListener('error', (e) => {
                audioState.delete(mediaElement);
                reject(new Error('Media element error'));
            }, { once: true });
        }
    });

    audioState.set(mediaElement, promise);
    return promise;
}

// --- Core Logic ---

async function applyVolumeRespectfully(mediaElement, volume) {
    if (mediaElement.muted || mediaElement.volume === 0) {
        return; // Respect site's mute setting
    }

    let state;
    try {
        state = await getOrCreateAudioState(mediaElement);
    } catch (error) {
        console.error('VVC: Failed to get audio state for media element.', error, mediaElement);
        return;
    }

    if (!state || state.inUse) {
        return;
    }

    if (state.gainNode) {
        state.gainNode.gain.value = volume;
        if (mediaElement.volume !== 1) {
            mediaElement.volume = 1;
        }
        if (mediaElement.muted) {
            mediaElement.muted = false;
        }
    }
}

function applyVolumeToAllMediaElements(volume) {
    const mediaElements = recursivelyFindMediaElements(document.body);
    for (const media of mediaElements) {
        applyVolumeRespectfully(media, volume);
    }
}

// --- Element Discovery ---

function recursivelyFindMediaElements(element, mediaList = []) {
    if (!element) return mediaList;

    element.querySelectorAll('video, audio').forEach(media => {
        if (!mediaList.includes(media)) {
            mediaList.push(media);
        }
    });

    element.querySelectorAll('*').forEach(child => {
        if (child.shadowRoot) {
            recursivelyFindMediaElements(child.shadowRoot, mediaList);
        }
    });
    return mediaList;
}

// --- Observers and Listeners ---

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const newMediaElements = recursivelyFindMediaElements(node);
                newMediaElements.forEach(media => applyVolumeRespectfully(media, currentVolume));
            }
        }
    }
});

if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    }, { once: true });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setVolume') {
        currentVolume = request.volume;
        applyVolumeToAllMediaElements(request.volume);
        sendResponse({ success: true });
    }
    return true;
});

// --- Initial Application ---

function initialize() {
    chrome.runtime.sendMessage({ action: 'getVolume' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('VVC:', chrome.runtime.lastError.message);
            return;
        }
        if (response && typeof response.volume === 'number') {
            currentVolume = response.volume;
            applyVolumeToAllMediaElements(currentVolume);
        }
    });
}

initialize();
