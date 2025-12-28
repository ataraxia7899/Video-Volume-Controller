<div align="center">

### 🌐 README Language : [English](README.md) | [한국어](README.ko.md)
<br>

# 🎵 Video Volume Controller

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web_Store-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba)
[![Users](https://img.shields.io/chrome-web-store/users/begolcfbgiopgodhfijbppokmnddchei?color=blue)](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba)
[![Version](https://img.shields.io/badge/Version-1.0.7-blue)](https://github.com/ataraxia7899/Video-Volume-Controller)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Language](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**A Chrome extension that controls tab audio volume with Web Audio API**

[**Download from Chrome Web Store**](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba)

---
</div>

## 🛠️ Tech Stack

| Category | Technologies |
|:---------|:-------------|
| **Core** | HTML5, CSS3, JavaScript (ES6+) |
| **APIs** | Chrome Extension API (Manifest V3) |
| | Web Audio API |
| | Tab Capture API |
| | Offscreen API |
| **Architecture** | Service Worker (Background) |
| | Offscreen Document (Audio Processing) |

---

## ✨ Features

- 🎚️ **Per-Tab Volume Control**: Independent volume settings for each tab (0% - 300%)
- 🔊 **Audio Amplification**: Boost volume up to 300% using Web Audio API
- ⌨️ **Keyboard Shortcuts**: Quick volume control without opening the popup
  - `Ctrl+Shift+Up`: Increase volume by 10%
  - `Ctrl+Shift+Down`: Decrease volume by 10%
  - `Ctrl+Shift+Left`: Toggle mute
  - `Ctrl+Shift+Right`: Reset to 100%
- 🎨 **Modern UI**: Clean and intuitive interface with visual feedback
- 🌓 **Dark Mode**: Manual toggle and automatic system theme sync
- 📊 **Real-time Feedback**: Visual slider with color-coded volume levels
- ⚡ **Smart Debouncing**: Optimized storage with real-time volume adjustment
- 🌍 **Multi-language Support**: English, Korean, Spanish, Chinese, Hindi, Portuguese, Russian, Japanese, German, French

---

## 🚀 Installation

### From Chrome Web Store (Recommended)

Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba) and click "Add to Chrome"

### Manual Installation (For Development)

1. Clone this repository
```bash
git clone https://github.com/ataraxia7899/Video-Volume-Controller.git
cd Video-Volume-Controller
```

2. Load the extension in Chrome
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `Video-Volume-Controller` folder

---

## 📂 Project Structure

```text
📦 Video-Volume-Controller/
├── 📄 manifest.json          # Extension configuration (Manifest V3)
├── 📄 background.js           # Service worker (event handling, state management)
├── 📄 offscreen.html          # Offscreen document for audio processing
├── 📄 offscreen.js            # Audio capture and volume control logic
├── 📄 popup.html              # Extension popup UI
├── 📄 popup.js                # Popup logic and event handlers
├── 📄 popup.css               # Popup styles
├── 📂 icons/                  # Extension icons
│   ├── 📄 icon16.png
│   ├── 📄 icon48.png
│   └── 📄 icon128.png
└── 📂 _locales/              # Internationalization
    ├── 📂 en/
    │   └── 📄 messages.json
    ├── 📂 ko/
    │   └── 📄 messages.json
    └── 📂 ... (es, zh, hi, pt, ru, ja, de, fr)
```

---

## 🎯 Usage

1. Click the extension icon in the Chrome toolbar
2. Adjust volume using the slider or number input (0-300%)
3. Use preset buttons for quick settings (0%, 25%, 50%, 75%, 100%, 150%)
4. Apply current volume to all tabs with one click
5. Toggle dark mode with the sun/moon button

---

## 📋 Recent Updates

### v1.0.7 (2025-12-28)

**New Features**
- 🌓 **Dark Mode**: Manual toggle and automatic system theme synchronization
  - Sun/moon button for manual switching
  - Respects `prefers-color-scheme` media query
  - Persistent preference stored locally
- 📊 **Real-time Visual Feedback**: Dynamic slider with color-coded volume levels
  - Blue for 0-100% (normal range)
  - Orange to red for 100-300% (amplified range)
  - Smooth hover and active animations
- ⚡ **Smart Debouncing**: Real-time volume changes with optimized storage
  - Instant audio feedback while dragging
  - Debounced storage writes (150ms)
  - Guaranteed save on slider release

**Optimizations**
- 🔧 **Memory Leak Fix**: Proper async handling of AudioContext cleanup
- 🏃 **Race Condition Resolution**: State synchronization between background and offscreen
- 🗑️ **Storage Cleanup**: Automatic removal of orphaned tab data on startup
- ⚡ **Parallel Processing**: `Promise.allSettled` for applying volume to all tabs
- 🎨 **Code Quality**: Unified constants, Korean comments, removed unused code

**Bug Fixes**
- ✅ Fixed AudioContext not properly closing (potential memory leak)
- ✅ Fixed tab capture state desynchronization
- ✅ Enhanced error handling for restricted pages (chrome:// URLs)
- ✅ Improved error message parsing for various capture failure scenarios

---

## ⚙️ Advanced Features

### Visual Feedback
- **Slider color changes** based on volume level
  - **Blue**: 0-100% (normal range)
  - **Orange to Red**: 100-300% (amplified range)
- **Hover effects** and animations on controls

### Dark Mode
- Manual toggle via sun/moon button
- Automatic system theme detection (`prefers-color-scheme`)
- Persistent preference stored locally

### Smart Volume Adjustment
- **Real-time** volume changes while dragging slider
- **Debounced** storage writes to optimize performance
- **Guaranteed** save on slider release

---

## 🔧 Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|:-------|:--------------|:------|
| Increase Volume | `Ctrl+Shift+Up` | `Cmd+Shift+Up` |
| Decrease Volume | `Ctrl+Shift+Down` | `Cmd+Shift+Down` |
| Toggle Mute | `Ctrl+Shift+Left` | `Cmd+Shift+Left` |
| Reset to 100% | `Ctrl+Shift+Right` | `Cmd+Shift+Right` |

*Customize shortcuts at `chrome://extensions/shortcuts`*

---

## 📜 License & Contact

- **License**: MIT
- **Purpose**: Learning and Portfolio Project
- **Contact**: ataraxia7899@gmail.com
- **GitHub**: [ataraxia7899/Video-Volume-Controller](https://github.com/ataraxia7899/Video-Volume-Controller)
