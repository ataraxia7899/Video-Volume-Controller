<div align="center">

### 🌐 README 언어 : [English](README.md) | [한국어](README.ko.md)
<br>

# 🎵 Video Volume Controller

[![Chrome 웹 스토어](https://img.shields.io/badge/Chrome-웹_스토어-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/begolcfbgiopgodhfijbppokmnddchei)
[![사용자 수](https://img.shields.io/chrome-web-store/users/begolcfbgiopgodhfijbppokmnddchei?label=사용자%20수&color=blue)](https://chromewebstore.google.com/detail/begolcfbgiopgodhfijbppokmnddchei)
[![버전](https://img.shields.io/badge/버전-1.0.7-blue)](https://github.com/ataraxia7899/Video-Volume-Controller)
[![라이선스](https://img.shields.io/badge/라이선스-MIT-green)](LICENSE)
[![언어](https://img.shields.io/badge/언어-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**Web Audio API를 활용한 탭별 오디오 볼륨 조절 크롬 확장 프로그램**

[**크롬 웹스토어에서 다운로드**](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba)

---
</div>

## 🛠️ 기술 스택

| 분류 | 기술 |
|:-----|:-----|
| **Core** | HTML5, CSS3, JavaScript (ES6+) |
| **APIs** | Chrome Extension API (Manifest V3) |
| | Web Audio API |
| | Tab Capture API |
| | Offscreen API |
| **아키텍처** | Service Worker (백그라운드) |
| | Offscreen Document (오디오 처리) |

---

## ✨ 주요 기능

- 🎚️ **탭별 볼륨 제어**: 각 탭마다 독립적인 볼륨 설정 (0% - 300%)
- 🔊 **오디오 증폭**: Web Audio API를 사용하여 최대 300%까지 볼륨 증폭
- ⌨️ **키보드 단축키**: 팝업을 열지 않고도 빠르게 볼륨 조절
  - `Ctrl+Shift+Up`: 볼륨 10% 증가
  - `Ctrl+Shift+Down`: 볼륨 10% 감소
  - `Ctrl+Shift+Left`: 음소거 토글
  - `Ctrl+Shift+Right`: 100%로 초기화
- 🎨 **현대적인 UI**: 시각적 피드백이 있는 깔끔하고 직관적인 인터페이스
- 🌓 **다크모드**: 수동 전환 및 시스템 테마 자동 연동
- 📊 **실시간 피드백**: 볼륨 레벨에 따라 색상이 변하는 시각적 슬라이더
- ⚡ **스마트 디바운싱**: 실시간 볼륨 조절과 최적화된 저장
- 🌍 **다국어 지원**: 영어, 한국어, 스페인어, 중국어, 힌디어, 포르투갈어, 러시아어, 일본어, 독일어, 프랑스어

---

## 🚀 설치 방법

### Chrome 웹 스토어에서 설치 (권장)

[Chrome 웹 스토어](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba)에서 "Chrome에 추가" 클릭

### 수동 설치 (개발용)

1. 저장소 복제
```bash
git clone https://github.com/ataraxia7899/Video-Volume-Controller.git
cd Video-Volume-Controller
```

2. Chrome에 확장 프로그램 로드
   - `chrome://extensions` 열기
   - "개발자 모드" 활성화
   - "압축해제된 확장 프로그램을 로드합니다" 클릭
   - `Video-Volume-Controller` 폴더 선택

---

## 📂 프로젝트 구조

```text
📦 Video-Volume-Controller/
├── 📄 manifest.json          # 확장 프로그램 설정 (Manifest V3)
├── 📄 background.js           # Service worker (이벤트 처리, 상태 관리)
├── 📄 offscreen.html          # 오디오 처리용 오프스크린 문서
├── 📄 offscreen.js            # 오디오 캡처 및 볼륨 조절 로직
├── 📄 popup.html              # 확장 프로그램 팝업 UI
├── 📄 popup.js                # 팝업 로직 및 이벤트 핸들러
├── 📄 popup.css               # 팝업 스타일
├── 📂 icons/                  # 확장 프로그램 아이콘
│   ├── 📄 icon16.png
│   ├── 📄 icon48.png
│   └── 📄 icon128.png
└── 📂 _locales/              # 다국어 지원
    ├── 📂 en/
    │   └── 📄 messages.json
    ├── 📂 ko/
    │   └── 📄 messages.json
    └── 📂 ... (es, zh, hi, pt, ru, ja, de, fr)
```

---

## 🎯 사용 방법

1. Chrome 도구 모음에서 확장 프로그램 아이콘 클릭
2. 슬라이더 또는 숫자 입력으로 볼륨 조절 (0-300%)
3. 프리셋 버튼으로 빠른 설정 (0%, 25%, 50%, 75%, 100%, 150%)
4. 한 번의 클릭으로 모든 탭에 현재 볼륨 적용
5. 태양/달 버튼으로 다크모드 전환

---

## 📋 최근 업데이트

### v1.0.7 (2025-12-28)

**새로운 기능**
- 🌓 **다크모드**: 수동 전환 및 시스템 테마 자동 연동
  - 태양/달 버튼으로 수동 전환
  - `prefers-color-scheme` 미디어 쿼리 지원
  - 로컬에 설정 저장
- 📊 **실시간 시각적 피드백**: 볼륨 레벨에 따라 색상이 변하는 슬라이더
  - 0-100%는 파란색 (일반 범위)
  - 100-300%는 주황-빨강 (증폭 범위)
  - 부드러운 호버 및 액티브 애니메이션
- ⚡ **스마트 디바운싱**: 실시간 볼륨 변경과 최적화된 저장
  - 드래그 중 즉시 오디오 피드백
  - 디바운스된 저장 (150ms)
  - 슬라이더 릴리즈 시 저장 보장

**최적화**
- 🔧 **메모리 누수 수정**: AudioContext 정리의 적절한 async 처리
- 🏃 **Race Condition 해결**: 백그라운드와 오프스크린 간 상태 동기화
- 🗑️ **Storage 정리**: 시작 시 고아 탭 데이터 자동 제거
- ⚡ **병렬 처리**: 모든 탭에 볼륨 적용 시 `Promise.allSettled` 사용
- 🎨 **코드 품질**: 상수 통합, 한글 주석, 미사용 코드 제거

**버그 수정**
- ✅ AudioContext가 제대로 닫히지 않던 문제 수정 (메모리 누수 가능성)
- ✅ 탭 캡처 상태 비동기화 문제 수정
- ✅ 제한된 페이지(chrome:// URL)에 대한 에러 처리 강화
- ✅ 다양한 캡처 실패 시나리오에 대한 에러 메시지 파싱 개선

---

## ⚙️ 고급 기능

### 시각적 피드백
- 볼륨 레벨에 따라 **슬라이더 색상 변경**
  - **파랑**: 0-100% (일반 범위)
  - **주황-빨강**: 100-300% (증폭 범위)
- 컨트롤에 **호버 효과** 및 애니메이션

### 다크모드
- 태양/달 버튼으로 수동 전환
- 시스템 테마 자동 감지 (`prefers-color-scheme`)
- 로컬에 설정 저장

### 스마트 볼륨 조절
- 슬라이더 드래그 중 **실시간** 볼륨 변경
- 성능 최적화를 위한 **디바운스** 저장
- 슬라이더 릴리즈 시 저장 **보장**

---

## 🔧 키보드 단축키

| 동작 | Windows/Linux | macOS |
|:-----|:--------------|:------|
| 볼륨 증가 | `Ctrl+Shift+Up` | `Cmd+Shift+Up` |
| 볼륨 감소 | `Ctrl+Shift+Down` | `Cmd+Shift+Down` |
| 음소거 토글 | `Ctrl+Shift+Left` | `Cmd+Shift+Left` |
| 100%로 초기화 | `Ctrl+Shift+Right` | `Cmd+Shift+Right` |

*단축키는 `chrome://extensions/shortcuts`에서 사용자 지정 가능*

---

## 📜 라이선스 및 연락처

- **라이선스**: MIT
- **목적**: 학습 및 포트폴리오 프로젝트
- **연락처**: ataraxia7899@gmail.com
- **GitHub**: [ataraxia7899/Video-Volume-Controller](https://github.com/ataraxia7899/Video-Volume-Controller)
