# 🏋️ 운동 기록 웹 입력 툴 (Workout Logger Web Tool)

Raspberry Pi 4를 서버로 사용하여 개발한 **운동 기록 웹 애플리케이션**입니다.  
모바일과 데스크톱에서 접근 가능하며, 맨몸 운동 중심의 입력을 지원하고, 최근 기록 조회 및 시각화를 제공합니다.

---

## 🚀 프로젝트 개요

| 항목            | 내용 |
|-----------------|------|
| **서버 플랫폼** | Raspberry Pi 4 (Python 3) |
| **프레임워크**  | Flask |
| **데이터 저장** | JSON (`records.json`) |
| **프론트엔드**  | HTML + JavaScript (Vanilla) |
| **시각화**      | Chart.js |

---

## ✅ 현재 구현된 기능

### 📥 운동 기록 입력 페이지 (`/`)
- 날짜 및 시간: 기본값은 현재 시간, 수동 수정 가능
- 운동 선택: 푸시업, 스쿼트, 플랭크, 런지 등 맨몸 운동 위주
- 운동 종류에 따라 동적으로 입력 필드 표시 (반복수, 시간 등)
- 동일한 날짜와 운동명에 대해 여러 번 입력 가능
- 최근 20개 기록을 페이지 하단에 최신순으로 자동 표시

### 📊 시각화 페이지 (`/stats`)
- 운동 종류별 횟수 막대그래프
- 월별 운동 분포 파이차트
- Chart.js 기반 인터랙티브 그래프 제공

### 🔧 서버 운영 방식
- Flask 앱을 systemd 서비스로 등록하여 라즈베리파이 부팅 시 자동 실행
- `sudo systemctl restart workout_logger`로 코드 반영

---

## 🗂️ 폴더 구조

```
workout_logger/  
├── app.py # Flask 메인 앱  
├── templates/  
│ ├── home.html # 대시보드 홈
│ ├── log.html  # 운동 입력 및 기록 확인 페이지
│ └── stats.html # 시각화 페이지
├── static/  
│ ├── main.js # 입력 페이지 JS  
│ ├── stats.js # 시각화 페이지 JS  
│ └── style.css # 공통 스타일  
├── data/  
│ └── records.json # 운동 기록 저장 파일 (Git 제외 대상)  
└── .gitignore # 불필요 파일 제외
```

---

## 🔮 앞으로 추가할 기능

1. **모바일 대응 CSS 개선**
   - 반응형 레이아웃
   - 버튼/입력 필드 크기 최적화
2. **운동 기록 수정 및 삭제 기능**
   - 기록별 고유 ID 기반 수정/삭제
   - 기록 목록 인터페이스 개선
3. **메인 대시보드 구성**
   - 기록 입력 / 시각화 / 설정 페이지로 이동 가능
   - 네비게이션 구성
4. **시각화 기능 개선**
   - 주간/월간 활동 변화 추이 그래프
   - 운동량 총합 그래프
   - 필터(운동명, 기간 등) 기능 추가

---

## 🛠️ 설치 및 실행

```bash
# Flask 설치
pip3 install flask

# 앱 실행
python3 app.py
````

> 또는 systemd 서비스 등록:

```bash
sudo systemctl enable workout_logger
sudo systemctl start workout_logger
```

---

## 📁 기록 데이터 포맷 (records.json)

```json
{
  "datetime": "2025-06-04T10:30",
  "exercise": "푸시업",
  "reps": 20
}
```

> 운동 종류에 따라 `reps`, `duration`, `direction` 등이 포함됨

---

## 📜 라이선스

MIT License

---

## 🙋‍♂️ 제작자

개발자: ParkSeongGyeol
Contact: skp0626@naver.com
