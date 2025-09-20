const audioState = new Map();
let pageAudioContext = null;
let currentVolume = 1.0; // Variable to store the current volume

// --- AudioContext Management ---

function resumeAudioContextIfNeeded() {
	if (pageAudioContext && pageAudioContext.state === 'suspended') {
		pageAudioContext
			.resume()
			.catch((e) => console.error('VVC: AudioContext resume failed.', e));
	}
}

function getPageAudioContext() {
	if (!pageAudioContext) {
		try {
			pageAudioContext = new (window.AudioContext ||
				window.webkitAudioContext)();
			// The AudioContext is created in a suspended state until a user gesture.
			// We'll add event listeners to resume it on the first interaction.
			const resumeEvents = ['click', 'keydown', 'scroll', 'touchstart'];
			resumeEvents.forEach((eventName) => {
				document.addEventListener(eventName, resumeAudioContextIfNeeded, {
					once: true,
				});
			});
		} catch (e) {
			console.error(
				'Video Volume Controller: Could not create AudioContext.',
				e
			);
			return null;
		}
	}
	return pageAudioContext;
}

async function getOrCreateAudioState(video) {
	if (audioState.has(video)) {
		const state = audioState.get(video);
		return state instanceof Promise ? await state : state;
	}

	const promise = new Promise((resolve, reject) => {
		const setup = () => {
			const audioContext = getPageAudioContext();
			if (!audioContext) {
				resolve({}); // Resolve with empty state if context fails
				return;
			}

			try {
				const source = audioContext.createMediaElementSource(video);
				const gainNode = audioContext.createGain();
				source.connect(gainNode);
				gainNode.connect(audioContext.destination);
				const state = { source, gainNode };
				audioState.set(video, state); // Replace promise with actual state
				resolve(state);
			} catch (error) {
				if (error.name === 'InvalidStateError') {
					console.warn(
						'VVC: Video element is already in use. The extension will not control this video.'
					);
					const state = { inUse: true };
					audioState.set(video, state);
					resolve(state);
				} else {
					audioState.delete(video); // Don't cache errors
					reject(error);
				}
			}
		};

		if (video.readyState >= 1) {
			setup();
		} else {
			video.addEventListener('loadedmetadata', setup, { once: true });
			video.addEventListener(
				'error',
				(e) => {
					audioState.delete(video);
					reject(new Error('Video element error'));
				},
				{ once: true }
			);
		}
	});

	audioState.set(video, promise);
	return promise;
}

// --- Volume Application Logic ---

async function applyVolumeToSingleVideo(video, volume) {
	// Heuristic: Ignore videos that are likely managed by the page's own script.
	if (video.hasAttribute('autoplay') && video.defaultMuted) {
		return;
	}

	let state;
	try {
		state = await getOrCreateAudioState(video);
	} catch (error) {
		console.error('VVC: Failed to get audio state for video.', error, video);
		return;
	}

	if (!state || state.inUse) {
		return;
	}

	if (state.gainNode) {
		// Always set the gain node's value. This is safe and prepares the volume level.
		state.gainNode.gain.value = volume;

		// Attempt to unmute if volume is positive. This may trigger an autoplay policy warning,
		// which is expected. The volume will be correctly applied once the user interacts
		// with the page or the video itself.
		if (volume > 0 && video.muted) {
			// Ensure context is running before trying to make sound.
			resumeAudioContextIfNeeded();
			video.muted = false;
		}
	}
}

async function applyVolumeToAllVideos(volume) {
	const videos = document.querySelectorAll('video');
	for (const video of videos) {
		await applyVolumeToSingleVideo(video, volume);
	}
}

// --- Observers and Listeners ---

const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (node.tagName === 'VIDEO') {
					applyVolumeToSingleVideo(node, currentVolume);
				} else {
					const videos = node.querySelectorAll('video');
					videos.forEach((video) =>
						applyVolumeToSingleVideo(video, currentVolume)
					);
				}
			}
		}
	}
});

// Start observing the document body for new elements
if (document.body) {
	observer.observe(document.body, { childList: true, subtree: true });
} else {
	// If body is not ready yet, wait for it.
	document.addEventListener(
		'DOMContentLoaded',
		() => {
			observer.observe(document.body, { childList: true, subtree: true });
		},
		{ once: true }
	);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'setVolume') {
		currentVolume = request.volume;
		(async () => {
			await applyVolumeToAllVideos(request.volume);
			sendResponse({ success: true });
		})();
	}
	return true; // Indicate async response
});

// --- Initial Volume Application ---

function initialize() {
	chrome.runtime.sendMessage({ action: 'getVolume' }, (response) => {
		if (chrome.runtime.lastError) {
			console.error('VVC:', chrome.runtime.lastError.message);
			return;
		}
		if (response && typeof response.volume === 'number') {
			currentVolume = response.volume;
			applyVolumeToAllVideos(currentVolume);
		}
	});
}

initialize();
