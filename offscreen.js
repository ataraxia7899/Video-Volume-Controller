// offscreen.js

// Map to store audio contexts and gain nodes for each tab
const audioMap = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start-capture') {
    startCapture(request.tabId, request.streamId, request.volume);
    sendResponse({ success: true });
  } else if (request.action === 'set-volume') {
    setVolume(request.tabId, request.volume);
    sendResponse({ success: true });
  } else if (request.action === 'stop-capture') {
    stopCapture(request.tabId);
    sendResponse({ success: true });
  }
  return true;
});

async function startCapture(tabId, streamId, volume) {
  if (audioMap.has(tabId)) {
    // If already capturing, just set the volume
    setVolume(tabId, volume);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const gainNode = audioContext.createGain();

    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    audioMap.set(tabId, { stream, audioContext, gainNode });

  } catch (error) {
    console.error('Error starting tab audio capture:', error);
  }
}

function setVolume(tabId, volume) {
  if (audioMap.has(tabId)) {
    const { gainNode } = audioMap.get(tabId);
    gainNode.gain.value = volume;
  }
}

function stopCapture(tabId) {
  if (audioMap.has(tabId)) {
    const { stream, audioContext } = audioMap.get(tabId);
    stream.getTracks().forEach(track => track.stop());
    audioContext.close();
    audioMap.delete(tabId);
  }
}
