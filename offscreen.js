// offscreen.js

// Map to store audio contexts and gain nodes for each tab
const audioMap = new Map();

// 백그라운드 스크립트로부터 메시지 수신 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'start-capture') {
        const result = await startCapture(request.tabId, request.streamId, request.volume);
        sendResponse(result);
      } else if (request.action === 'set-volume') {
        setVolume(request.tabId, request.volume);
        sendResponse({ success: true });
      } else if (request.action === 'stop-capture') {
        await stopCapture(request.tabId);
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('메시지 처리 중 오류:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
});

// 탭 오디오 캡처 시작
async function startCapture(tabId, streamId, volume) {
  // 이미 캡처 중인 경우, 볼륨만 설정하고 성공 반환
  if (audioMap.has(tabId)) {
    setVolume(tabId, volume);
    return { success: true, alreadyCapturing: true };
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
    return { success: true };

  } catch (error) {
    // DOMException의 경우 name과 message를 모두 확인
    const errorName = error.name || 'Unknown';
    const errorMessage = error.message || String(error);
    console.error(`탭 오디오 캡처 시작 중 오류 [${errorName}]:`, errorMessage);
    return { success: false, error: `${errorName}: ${errorMessage}` };
  }
}

function setVolume(tabId, volume) {
  if (audioMap.has(tabId)) {
    const { gainNode } = audioMap.get(tabId);
    gainNode.gain.value = volume;
  }
}

// 탭 오디오 캡처 중지 및 리소스 해제
async function stopCapture(tabId) {
  if (audioMap.has(tabId)) {
    const { stream, audioContext } = audioMap.get(tabId);
    stream.getTracks().forEach(track => track.stop());
    try {
      await audioContext.close();
    } catch (error) {
      console.error('AudioContext 종료 중 오류 발생:', error);
    }
    audioMap.delete(tabId);
  }
}
