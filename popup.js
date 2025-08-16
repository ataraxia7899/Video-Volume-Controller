// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeInput = document.getElementById('volume-input');
    const currentVolumeSpan = document.getElementById('current-volume');
    const presetButtons = document.querySelectorAll('.preset-btn');

    let activeTabId = null;

    // Function to update the UI
    function updateUI(volumePercent) {
        const cleanVolume = Math.round(volumePercent);
        currentVolumeSpan.textContent = cleanVolume;
        volumeSlider.value = cleanVolume;
        volumeInput.value = cleanVolume;
    }

    // Function to set volume
    function setVolume(volumePercent) {
        if (!activeTabId) return;

        const volume = parseFloat(volumePercent) / 100.0;
        updateUI(volumePercent);

        chrome.runtime.sendMessage({
            action: 'setVolume',
            tabId: activeTabId,
            volume: volume
        });
    }

    // Initialize the popup
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            activeTabId = tabs[0].id;

            // Get the initial volume for the tab from the background script
            chrome.runtime.sendMessage({ action: 'getVolume', tabId: activeTabId }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    // You could display an error message in the popup here
                } else if (response && typeof response.volume === 'number') {
                    updateUI(response.volume * 100);
                }
            });
        } else {
            // Handle case where there is no active tab
            currentVolumeSpan.textContent = 'N/A';
            volumeSlider.disabled = true;
            volumeInput.disabled = true;
            presetButtons.forEach(b => b.disabled = true);
        }
    });

    // Event Listeners
    volumeSlider.addEventListener('input', (event) => {
        const volumePercent = event.target.value;
        updateUI(volumePercent);
    });

    volumeSlider.addEventListener('change', (event) => {
        const volumePercent = event.target.value;
        setVolume(volumePercent);
    });

    volumeInput.addEventListener('change', (event) => {
        let volumePercent = parseInt(event.target.value, 10);
        if (isNaN(volumePercent)) {
            volumePercent = 100;
        }
        // Clamp the value
        volumePercent = Math.max(0, Math.min(300, volumePercent));
        setVolume(volumePercent);
    });

    presetButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const volumePercent = event.target.dataset.volume;
            setVolume(volumePercent);
        });
    });
});
