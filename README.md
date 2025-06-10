# 🏋️ 운동 기록 웹 앱

이 애플리케이션은 개인 운동 기록을 손쉽게 관리하고 통계를 시각화하기 위한 Flask 기반 웹 앱입니다. 모바일과 데스크톱 브라우저 모두에서 사용할 수 있으며, 최근 업데이트로 영상 관리 기능이 추가되었습니다.

---

## 📌 주요 기능

### 1. 홈 `/`
- 운동 종류, 날짜/시간, 반복 횟수 등을 입력하여 기록 저장
- 입력된 최근 20개의 기록을 확인 가능

### 2. 기록 관리 `/log`
- 모든 기록을 표 형태로 확인
- 모바일 화면에서는 필요한 정보만 축약하여 표시
- 체크박스로 여러 기록을 선택해 삭제 또는 수정 가능

### 3. 통계 `/stats`
- 최근 30일 또는 지정한 기간에 대한 통계 차트 제공
- 주차별 운동 시간, 운동 종류별 빈도, 월별 요약 등 확인
- CSV 파일로 데이터 다운로드 가능

### 4. 영상 관리 `/videos`
- 유튜브 링크 또는 로컬 파일 업로드를 통한 운동 영상 추가
- 영상 제목과 운동 종류를 저장하고, 목록에서 수정/삭제/다운로드 가능

---

## 🗂 폴더 구조
```
.
├── app.py               # Flask 애플리케이션
├── data/
│   ├── records.json     # 운동 기록 저장소 (git 제외 대상)
│   ├── videos.json      # 영상 메타데이터
│   └── uploads/         # 업로드된 영상 파일(ignored)
├── static/
│   ├── main.js          # 홈 페이지 스크립트
│   ├── manage.js        # 기록 관리 스크립트
│   ├── stats.js         # 통계 페이지 스크립트
│   ├── videos.js        # 영상 관리 스크립트
│   └── style.css        # 공통 스타일
├── templates/
│   ├── home.html
│   ├── log.html
│   ├── stats.html
│   └── videos.html
└── README.md
```

---

## 🚀 실행 방법
1. 의존 패키지 설치
   ```bash
   pip install -r requirements.txt
   ```
2. 서버 실행
   ```bash
   python app.py
   ```
3. 브라우저에서 `http://localhost:5000` 접속

---

## 🔧 기타 사항
- `data/records.json` 과 `data/uploads/` 폴더는 `.gitignore`에 포함되어 있어 버전 관리에서 제외됩니다.
- 서버를 중단 없이 실행하려면 Flask 외에 production WSGI 서버(gunicorn 등)를 사용할 수 있습니다.

---

## 🆕 새 환경에서 시작하기

처음 프로젝트를 클론한 뒤 다음 순서대로 준비하면 됩니다.

### 1. 가상 환경 및 패키지 설치

```bash
python -m venv venv
source venv/bin/activate  # Windows는 venv\Scripts\activate
pip install -r requirements.txt
```
또는 위 과정을 자동화한 `setup.sh` 스크립트를 실행할 수도 있습니다.

```bash
./setup.sh
```

### 2. 데이터 파일 구성

프로젝트에는 기본 데이터가 포함되어 있지 않으므로 `data/` 폴더에 빈 파일을 생성합니다.
`setup.sh`를 사용했다면 이 과정은 자동으로 완료됩니다.

```bash
mkdir -p data/uploads
echo "[]" > data/records.json
echo "[]" > data/videos.json
```

### 3. 동작 확인 및 테스트

파이썬 문법 오류가 없는지 확인 후 서버를 실행합니다.

```bash
python -m py_compile app.py
python app.py
```

### 4. 시연 방법

브라우저에서 `http://localhost:5000` 에 접속하면 홈 화면이 표시됩니다. 이후 상단 메뉴를 통해 `Log`, `Stats`, `Videos` 페이지를 오가며 기능을 확인할 수 있습니다.


---

## 📈 다음 할 일

앞으로 개선하거나 시도해 볼 만한 아이디어를 간단히 정리합니다.

- 사용자 계정을 도입하여 여러 사람이 기록을 분리해서 관리
- 운동 종류와 영상 카테고리 추가 및 검색 기능 강화
- Docker 등을 활용한 배포 자동화 스크립트 작성
