// background.js

// --- 볼륨 관련 상수 ---
const VOLUME_CONFIG = {
    MIN: 0,           // 최소 볼륨 (0%)
    MAX: 3,           // 최대 볼륨 (300%)
    DEFAULT: 1.0,     // 기본 볼륨 (100%)
    STEP: 0.1         // 단축키 볼륨 조절 단위 (10%)
};

const tabVolumes = {}; // 탭별 볼륨 캐시 (메모리)
const capturingTabs = new Set(); // 현재 캡처 중인 탭 Set

// --- 시작 시 상태 동기화 ---

(async () => {
    try {
        // 캡처 중인 탭 상태 복원
        const capturedTabsInfo = await chrome.tabCapture.getCapturedTabs();
        for (const info of capturedTabsInfo) {
            if (info.tabId) {
                capturingTabs.add(info.tabId);
            }
        }
        
        // 현재 열린 탭 목록과 storage 비교하여 orphan 데이터 정리
        const [allTabs, storageData] = await Promise.all([
            chrome.tabs.query({}),
            chrome.storage.local.get(null)
        ]);
        
        const activeTabIds = new Set(allTabs.map(tab => tab.id.toString()));
        const orphanKeys = Object.keys(storageData).filter(key => {
            // 숫자로만 구성된 키(탭 ID)만 대상으로 확인
            return /^\d+$/.test(key) && !activeTabIds.has(key);
        });
        
        if (orphanKeys.length > 0) {
            await chrome.storage.local.remove(orphanKeys);
            console.log(`${orphanKeys.length}개의 orphan storage 항목 정리 완료`);
        }
    } catch (error) {
        console.error("시작 시 상태 동기화 오류:", error);
    }
})();


// --- Offscreen Document Management ---

let creatingOffscreenDocument = null; // Race condition 방지용 Promise

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

// --- 볼륨 및 캡처 로직 ---

async function getVolumeForTab(tabId) {
    if (tabId in tabVolumes) {
        return tabVolumes[tabId];
    }
    const result = await chrome.storage.local.get(tabId.toString());
    const volume = result[tabId.toString()] ?? VOLUME_CONFIG.DEFAULT;
    tabVolumes[tabId] = volume;
    return volume;
}

async function setVolumeForTab(tabId, volume) {
    const clampedVolume = Math.max(VOLUME_CONFIG.MIN, Math.min(VOLUME_CONFIG.MAX, volume));
    tabVolumes[tabId] = clampedVolume;
    await chrome.storage.local.set({ [tabId.toString()]: clampedVolume });

    await setupOffscreenDocument();

    if (capturingTabs.has(tabId)) {
        // 이미 캡처 중인 탭 - 볼륨만 변경
        chrome.runtime.sendMessage({
            action: 'set-volume',
            tabId: tabId,
            volume: clampedVolume
        });
    } else {
        try {
            const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
            // offscreen에서 캡처 결과를 받은 후 상태 업데이트
            const response = await chrome.runtime.sendMessage({
                action: 'start-capture',
                tabId: tabId,
                streamId: streamId,
                volume: clampedVolume
            });
            
            if (response && response.success) {
                capturingTabs.add(tabId);
            } else {
                console.error(`탭 ${tabId} 캡처 실패:`, response?.error);
            }
        } catch (error) {
            const errorMessage = error.message || '';
            
            // 이미 활성 스트림이 있는 경우 (다양한 에러 메시지 패턴 처리)
            const isActiveStreamError = 
                errorMessage.includes('active stream') ||
                errorMessage.includes('already being captured') ||
                errorMessage.includes('tab is already captured');
            
            // Chrome 내부 페이지 또는 activeTab 권한 미활성화
            const isRestrictedPageError = 
                errorMessage.includes('Chrome pages cannot be captured') ||
                errorMessage.includes('activeTab permission') ||
                errorMessage.includes('not been invoked');
            
            if (isActiveStreamError) {
                console.warn(`탭 ${tabId}의 오래된 캡처 상태 보정 중`);
                capturingTabs.add(tabId);
                chrome.runtime.sendMessage({
                    action: 'set-volume',
                    tabId: tabId,
                    volume: clampedVolume
                });
            } else if (errorMessage.includes('No tab with id') || errorMessage.includes('Invalid tab')) {
                // 탭이 존재하지 않는 경우 무시
                console.warn(`탭 ${tabId}이(가) 존재하지 않음`);
                delete tabVolumes[tabId];
                capturingTabs.delete(tabId);
            } else if (isRestrictedPageError) {
                // Chrome 내부 페이지 또는 권한 없는 페이지 - 경고만 출력 (에러 아님)
                console.info(`탭 ${tabId}은(는) 캡처할 수 없는 페이지입니다 (Chrome 내부 페이지 또는 권한 필요)`);
            } else {
                console.error(`탭 ${tabId} 캡처 불가:`, error);
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
            // 병렬 처리로 모든 탭에 볼륨 적용
            const promises = tabs
                .filter(tab => tab.id && tab.url && !tab.url.startsWith('chrome://'))
                .map(tab => setVolumeForTab(tab.id, volume));
            await Promise.allSettled(promises);
            sendResponse({ success: true });
        }
    })();
    return true; // 비동기 응답을 위해 true 반환
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
                // 먼저 이전 스트림을 중지하여 에러 방지
                await new Promise(resolve => chrome.runtime.sendMessage({ action: 'stop-capture', tabId: tabId }, resolve));

                // 저장된 볼륨으로 재캡처
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
                console.error(`탭 ${tabId} 업데이트 후 재캡처 실패:`, error);
                capturingTabs.delete(tabId); // 실패 시 상태 정리
            }
        })();
    }
});

// --- 단축키 명령 리스너 ---

chrome.commands.onCommand.addListener(async (command, tab) => {
    const tabId = tab.id;
    if (!tabId) return;

    const currentVolume = await getVolumeForTab(tabId);
    let newVolume;

    switch (command) {
        case 'increase-volume':
            newVolume = Math.min(VOLUME_CONFIG.MAX, currentVolume + VOLUME_CONFIG.STEP);
            break;
        case 'decrease-volume':
            newVolume = Math.max(VOLUME_CONFIG.MIN, currentVolume - VOLUME_CONFIG.STEP);
            break;
        case 'set-100-percent':
            newVolume = VOLUME_CONFIG.DEFAULT;
            break;
        case 'toggle-mute':
            newVolume = currentVolume > VOLUME_CONFIG.MIN ? VOLUME_CONFIG.MIN : VOLUME_CONFIG.DEFAULT;
            break;
        default:
            return; // 알 수 없는 명령
    }

    await setVolumeForTab(tabId, newVolume);
});