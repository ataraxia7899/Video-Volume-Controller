// popup.js

// 볼륨 관련 상수 (background.js와 동기화)
const VOLUME_CONFIG = {
    MIN_PERCENT: 0,      // 최소 볼륨 (%)
    MAX_PERCENT: 300,    // 최대 볼륨 (%)
    DEFAULT_PERCENT: 100, // 기본 볼륨 (%)
    DEBOUNCE_DELAY: 150  // 지연 저장 대기 시간 (ms)
};

// Debounce 함수 - 마지막 호출 후 지정된 시간이 지나면 실행
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
function localize() {
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        const localizedText = chrome.i18n.getMessage(key);
        if (localizedText) {
            elem.textContent = localizedText;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    localize();
    const volumeSlider = document.getElementById('volume-slider');
    const volumeInput = document.getElementById('volume-input');
    const currentVolumeSpan = document.getElementById('current-volume');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const applyAllBtn = document.getElementById('apply-all-btn');
    const shortcutsLink = document.getElementById('shortcuts-link');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    let activeTabId = null;
    
    // 다크모드 초기화 (저장된 설정 또는 시스템 설정 적용)
    initDarkMode();
    
    function initDarkMode() {
        chrome.storage.local.get('darkMode', (result) => {
            // 저장된 설정이 있으면 사용, 없으면 시스템 설정 사용
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = result.darkMode !== undefined ? result.darkMode : systemPrefersDark;
            
            if (isDark) {
                document.body.classList.add('dark-mode');
            }
            
            // 초기 슬라이더 색상 업데이트
            const currentVolume = parseInt(volumeSlider.value, 10);
            updateSliderVisual(currentVolume);
        });
        
        // 시스템 다크모드 설정 변경 감지
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            chrome.storage.local.get('darkMode', (result) => {
                // 사용자가 수동 설정한 적이 없으면 시스템 설정 따름
                if (result.darkMode === undefined) {
                    if (e.matches) {
                        document.body.classList.add('dark-mode');
                    } else {
                        document.body.classList.remove('dark-mode');
                    }
                    updateSliderVisual(parseInt(volumeSlider.value, 10));
                }
            });
        });
    }
    
    // 다크모드 토글 함수
    function toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        chrome.storage.local.set({ darkMode: isDark });
        
        // 슬라이더 색상 업데이트
        const currentVolume = parseInt(volumeSlider.value, 10);
        updateSliderVisual(currentVolume);
    }

    // UI 업데이트 함수
    function updateUI(volumePercent) {
        const cleanVolume = Math.round(volumePercent);
        currentVolumeSpan.textContent = cleanVolume;
        volumeSlider.value = cleanVolume;
        volumeInput.value = cleanVolume;
        
        // 슬라이더 진행률 시각적 피드백
        updateSliderVisual(cleanVolume);
    }
    
    // 슬라이더 진행률 색상 업데이트
    function updateSliderVisual(volumePercent) {
        const percentage = (volumePercent / VOLUME_CONFIG.MAX_PERCENT) * 100;
        
        // 볼륨에 따른 색상 변경 (100% 이하: 파랑, 초과: 주황)
        const color = volumePercent > 100 
            ? `hsl(${30 - (volumePercent - 100) * 0.15}, 90%, 55%)`  // 주황 → 빨강
            : 'var(--primary-color)';  // 기본 파랑
        
        volumeSlider.style.background = `linear-gradient(to right, ${color} ${percentage}%, #ddd ${percentage}%)`;
    }

    // 볼륨 설정 함수
    function setVolume(volumePercent) {
        if (!activeTabId) return;

        const volume = parseFloat(volumePercent) / 100.0;
        updateUI(volumePercent);

        chrome.runtime.sendMessage({
            action: 'setVolume',
            tabId: activeTabId,
            volume: volume
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('볼륨 설정 오류:', chrome.runtime.lastError.message);
            }
        });
    }
    
    // Debounce된 볼륨 설정 함수 (실시간 변경, 지연 저장)
    const debouncedSetVolume = debounce(setVolume, VOLUME_CONFIG.DEBOUNCE_DELAY);

    // 팝업 초기화
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            activeTabId = tabs[0].id;

            // 백그라운드 스크립트에서 탭의 초기 볼륨 가져오기
            chrome.runtime.sendMessage({ action: 'getVolume', tabId: activeTabId }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                } else if (response && typeof response.volume === 'number') {
                    updateUI(response.volume * 100);
                }
            });
        } else {
            // 활성 탭이 없는 경우 처리
            currentVolumeSpan.textContent = 'N/A';
            volumeSlider.disabled = true;
            volumeInput.disabled = true;
            presetButtons.forEach(b => b.disabled = true);
            applyAllBtn.disabled = true;
        }
    });

    // 이벤트 리스너
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // 슬라이더 드래그 중 실시간 볼륨 변경 + 지연 저장
    volumeSlider.addEventListener('input', (event) => {
        const volumePercent = event.target.value;
        updateUI(volumePercent);
        debouncedSetVolume(volumePercent); // 드래그 중 실시간 볼륨 변경 (debounce)
    });
    
    // 슬라이더에서 손을 떼면 즉시 저장 (보장)
    volumeSlider.addEventListener('change', (event) => {
        const volumePercent = event.target.value;
        setVolume(volumePercent); // 즉시 저장
    });

    volumeInput.addEventListener('change', (event) => {
        let volumePercent = parseInt(event.target.value, 10);
        // 유효하지 않은 숫자인 경우 슬라이더 값으로 복원
        if (isNaN(volumePercent)) {
            event.target.value = volumeSlider.value;
            return;
        }
        // 값 범위 제한
        volumePercent = Math.max(VOLUME_CONFIG.MIN_PERCENT, Math.min(VOLUME_CONFIG.MAX_PERCENT, volumePercent));
        setVolume(volumePercent);
    });

    presetButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const volumePercent = event.target.dataset.volume;
            setVolume(volumePercent);
        });
    });

    applyAllBtn.addEventListener('click', () => {
        const volumePercent = volumeSlider.value;
        const volume = parseFloat(volumePercent) / 100.0;
        chrome.runtime.sendMessage({
            action: 'applyToAllTabs',
            volume: volume
        });
    });

    shortcutsLink.addEventListener('click', (event) => {
        event.preventDefault();
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    });
});
