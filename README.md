# 📄 Video Volume Controller (Chrome Extension)

## 🖥️ 프로젝트 소개

이 프로젝트는 **Vanilla JavaScript**를 사용하여 개발된 **탭 오디오 볼륨 조절 크롬 확장 프로그램**입니다.

웹 페이지의 비디오뿐만 아니라 해당 탭에서 발생하는 **모든 소리**의 볼륨을 개별 탭 단위로 제어하고, 기본 100%를 초과하여 증폭할 수 있는 기능을 제공합니다. Chrome의 `Tab Capture`, `Offscreen API` 등 최신 브라우저 기술을 학습하고 활용하는 것을 목표로 제작되었습니다.

## ✨ 주요 기능

- **탭의 모든 오디오 제어**: 비디오, 배경 음악, 광고, 게임 사운드 등 탭에서 재생되는 모든 소리를 한 번에 제어합니다.
- **탭별 볼륨 제어**: 각 탭마다 독립적으로 볼륨을 설정하고 기억합니다.
- **볼륨 증폭**: Web Audio API를 사용하여 최대 300%까지 볼륨을 증폭할 수 있습니다.
- **단축키 지원**: 키보드만으로 빠르게 볼륨을 조절하고 음소거할 수 있습니다.
  - `Ctrl+Shift+Up`: 볼륨 10% 증가
  - `Ctrl+Shift+Down`: 볼륨 10% 감소
  - `Ctrl+Shift+Left`: 음소거/음소거 해제
  - `Ctrl+Shift+Right`: 볼륨 100%로 설정
  - (단축키는 `chrome://extensions/shortcuts`에서 직접 변경할 수 있습니다.)
- **직관적인 UI**: 슬라이더와 숫자 입력을 통해 손쉽게 볼륨을 조절할 수 있습니다.
- **프리셋 버튼**: 0%, 50%, 100% 등 미리 설정된 값으로 빠르게 볼륨을 변경할 수 있습니다.
- **전체 탭 적용**: 한 번의 클릭으로 현재 설정된 볼륨을 모든 탭에 일괄 적용합니다.
- **다국어 지원**: 사용자의 브라우저 언어에 맞춰 UI가 자동으로 변경됩니다.
  - 지원 언어: 영어(기본), 한국어, 스페인어, 중국어, 힌디어, 포르투갈어, 러시아어, 일본어, 독일어, 프랑스어

## 🛠️ 기술 스택

- **Core**: HTML, CSS, JavaScript (ES6+)
- **API**: Chrome Extension API (Manifest V3), Web Audio API, Tab Capture API, Offscreen API

## 🚀 크롬 웹스토어에서 다운받고 실행하기

크롬 웹스토어 링크 : [크롬 웹스토어](https://chromewebstore.google.com/detail/video-volume-controller/nhoeokdaalacbpdaoggnfdpofaafgjba '볼륨조절 확장프로그램 다운')

~~~
## 🚀 로컬에서 확장 프로그램 설치 및 실행하기 ( 테스트용 )

이 확장 프로그램을 로컬에서 테스트하려면 다음 단계를 따르세요.

### 1. 프로젝트 복제

```bash
# 1. 이 프로젝트를 복제(clone)합니다.
git clone <저장소_URL>

# 2. 프로젝트 디렉터리로 이동합니다.
cd Video-Volume-Controller
```

### 2. 크롬에 확장 프로그램 로드

1.  Chrome 브라우저를 열고 주소창에 `chrome://extensions`를 입력하여 확장 프로그램 관리 페이지로 이동합니다.
2.  페이지 우측 상단의 **'개발자 모드(Developer mode)'** 토글을 활성화합니다.
3.  좌측 상단에 나타나는 **'압축해제된 확장 프로그램을 로드합니다(Load unpacked)'** 버튼을 클릭합니다.
4.  파일 탐색기가 열리면, 이 프로젝트를 복제한 **`Video-Volume-Controller`** 폴더 전체를 선택하고 확인을 누릅니다.
5.  설치가 완료되면 확장 프로그램 목록에서 **Video Volume Controller**를 확인할 수 있습니다.
~~~

## 📂 디렉토리 구조

```text
📦 Video-Volume-Controller/             # 프로젝트 루트
├──📄 manifest.json                        # 확장 프로그램 설정 및 진입점
├──📄 background.js                        # 백그라운드 로직 (이벤트 처리, 상태 관리)
├──📄 content.js                           # 웹 페이지에 주입되어 DOM을 제어하는 스크립트
├──📄 popup.html                           # 확장 프로그램 아이콘 클릭 시 나타나는 팝업 UI
├──📄 popup.js                             # 팝업 UI의 동작 로직
├──📄 popup.css                            # 팝업 UI 스타일 시트
├──📂 icons/                                # 확장 프로그램 아이콘 폴더
│   ├──📄 icon16.png
│   ├──📄 icon48.png
│   └──📄 icon128.png
└──📂 _locales/                            # 다국어 지원 폴더
    ├──📂 en/
    │   └──📄 messages.json                  # 영어 번역
    ├──📂 ko/
    │   └──📄 messages.json                  # 한국어 번역
    └──📂 ... (es, zh, hi, pt, ru, ja, de, fr)
```

## 📜 라이선스 및 연락처

- 본 프로젝트는 학습 및 포트폴리오 용도로 작성되었습니다.
- 문의: `ataraxia7899@gmail.com`
