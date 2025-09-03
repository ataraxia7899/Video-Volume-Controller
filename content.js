// content.js

// Use a Map to associate AudioContexts and GainNodes with video elements
const audioState = new Map();
// Use a WeakMap to keep track of videos that should use standard volume control.
const standardVolumeVideos = new WeakMap();

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
        // Decide which volume control method to use, but only once per video.
        if (standardVolumeVideos.get(video) === undefined) {
            // If the video is muted and autoplay, we'll stick to standard volume control.
            // This is a heuristic to avoid breaking complex video players.
            if (video.muted && video.autoplay) {
                standardVolumeVideos.set(video, true);
            } else {
                standardVolumeVideos.set(video, false);
            }
        }

<<<<<<< HEAD
        const useStandardVolume = standardVolumeVideos.get(video);

        if (useStandardVolume) {
            // Use standard volume control for problematic videos.
            try {
                if (volume > 0) {
                    video.muted = false;
                }
                video.volume = Math.min(1, volume);
            } catch (e) {
                console.error("VVC: Error applying standard volume", e);
            }
        } else {
            // Use Web Audio API for all other videos to allow >100% volume.
            try {
                const state = getOrCreateAudioState(video);
                
                if (state.audioContext.state === 'suspended') {
                    state.audioContext.resume().catch(e => console.error("VVC: Error resuming audio context", e));
                }
                
                if (volume > 0) {
                    video.muted = false;
                }
                
                // Set video element volume to 1 to ensure full signal to the Web Audio API.
                video.volume = 1;
                // Use the gain node to control the final volume.
                state.gainNode.gain.value = volume;
=======
            // Use Web Audio API for volume > 100%
            const { gainNode } = getOrCreateAudioState(video);
            gainNode.gain.value = volume;
>>>>>>> parent of f1f7db4 (autoplay 및 muted 속성이 있는 비디오가 재생될 때, 브라우저는 오디오가 예기치 않게 재생되는 것을 막기 위해 AudioContext를 '일시 중단' 상태로 만드는 오류 처리를 했지만 해당 코드때문에 볼륨 조절하지 못하는 오류가 발생하여 AudioContext가 일시 중단 상태일 경우 이를 다시 시작(resume)하는 코드를 새로 추가함)

            } catch (error) {
                console.error('Video Volume Controller Error:', error);
                // Fallback for videos that don't work with Web Audio API
                video.volume = Math.min(1, volume);
            }
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