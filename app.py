"""Flask 기반 운동 기록 웹 애플리케이션의 서버 사이드 모듈."""

from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import csv
from io import StringIO, BytesIO
import os
import pytz
from werkzeug.utils import secure_filename

app = Flask(__name__)

# -----------------------------------------------
# 데이터 파일 위치 및 시간대 설정
# -----------------------------------------------
# 모든 기록은 data/records.json 파일에 저장된다.
# 앱 전역에서 한국 시간(KST)을 사용하기 위해 pytz로 타임존을 정의한다.
DATA_DIR = "data"
DATA_PATH = os.path.join(DATA_DIR, "records.json")
VIDEO_JSON = os.path.join(DATA_DIR, "videos.json")
VIDEO_DIR = os.path.join(DATA_DIR, "uploads")
KST = pytz.timezone("Asia/Seoul")


@app.route("/")
def home():
    """메인 페이지 렌더링."""
    return render_template("home.html")

@app.route("/log")
def log_page():
    """전체 기록을 관리하는 페이지."""
    return render_template("log.html")

@app.route("/stats")
def stats():
    """운동 통계를 시각화하는 페이지."""
    return render_template("stats.html")


@app.route("/videos")
def videos_page():
    """운동 영상을 관리하고 시청하는 페이지."""
    return render_template("videos.html")

@app.route("/records")
def get_recent_records():
    """최근 기록 20개를 반환."""
    if not os.path.exists(DATA_PATH):
        return jsonify([])
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
    # 최신순으로 20개
    recent = sorted(records, key=lambda x: x.get("datetime", ""), reverse=True)[:20]
    return jsonify(recent)

@app.route("/all-records")
def all_records():
    """모든 기록을 인덱스와 함께 반환."""
    if not os.path.exists(DATA_PATH):
        return jsonify([])
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
    return jsonify([{**r, "index": i} for i, r in enumerate(records)])

@app.route("/stats-data")
def stats_data():
    # 1. 날짜 필터링 파라미터 받아오기
    start_date_str = request.args.get("start")
    end_date_str = request.args.get("end")

    # 2. 날짜 파싱
    if start_date_str and end_date_str:
        try:
            # 날짜 입력값은 시간대 정보가 없으므로 KST 기준으로 지정해 준다.
            start_dt = datetime.fromisoformat(start_date_str).replace(tzinfo=KST)
            end_dt = (
                datetime.fromisoformat(end_date_str).replace(tzinfo=KST)
                + timedelta(days=1)
            )  # 종료일 포함
        except ValueError:
            return jsonify({"error": "Invalid date format"}), 400
    else:
        # 파라미터가 없을 경우 최근 30일 데이터를 사용한다.
        now_kst = datetime.now(KST)
        end_dt = now_kst + timedelta(days=1)
        start_dt = end_dt - timedelta(days=30)
        
    # 3. 파일 불러오기
    if not os.path.exists(DATA_PATH):
        records = []
    else:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            records = json.load(f)

    # 4. 필터링된 레코드만 추출
    filtered = []
    for r in records:
        try:
            dt = datetime.fromisoformat(r["datetime"])
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=pytz.UTC).astimezone(KST)
        except Exception:
            continue
        # 필터 조건에 맞는 레코드만 임시 datetime 객체와 함께 저장한다.
        if start_dt <= dt < end_dt:
            r["_datetime_obj"] = dt
            filtered.append(r)
    
    # 5. 분석 데이터 생성
    filtered.sort(key=lambda x: x["_datetime_obj"], reverse=True)
    recent_records = [{k: v for k, v in r.items() if k != "_datetime_obj"} for r in filtered[:20]]

    # 누적 통계를 위한 변수들 초기화
    total_duration = 0
    exercise_counter = Counter()  # 운동 종류별 횟수
    weekly_data = defaultdict(int)  # 주차별 운동 시간
    # 월별 통계: 푸시업/스쿼트/총 반복수/강도/칼로리 저장
    monthly_summary = defaultdict(
        lambda: {"푸시업": 0, "스쿼트": 0, "total_reps": 0, "intensity": 0, "calories": 0}
    )

    today = datetime.now(KST)
    
    for r in filtered:
        dt = r["_datetime_obj"]
        exercise = r.get("exercise", "")
        reps = r.get("reps", 0)
        duration = r.get("duration", 0)

        # ---------------------------------------
        # 단순한 칼로리 추정 로직
        # ---------------------------------------
        if exercise == "푸시업":
            cal = reps * 0.4
        elif exercise == "스쿼트":
            cal = reps * 0.5
        else:
            cal = 0

        ym = dt.strftime("%Y-%m")
        monthly_summary[ym][exercise] += reps
        monthly_summary[ym]["total_reps"] += reps
        monthly_summary[ym]["intensity"] += reps
        monthly_summary[ym]["calories"] += cal

        # 수행 시간 누적
        if duration:
            total_duration += duration
        elif exercise in ["푸시업", "스쿼트"]:
            total_duration += reps * 2

        # 주차 그룹
        week_label = f"Week {((today - dt).days) // 7 + 1}"
        weekly_data[week_label] += reps * 2

        # 종류 누적
        exercise_counter[exercise] += 1

    sorted_weeks = sorted(weekly_data.keys(), key=lambda x: int(x.split()[1]))
    weekly_durations = [weekly_data[w] for w in sorted_weeks]

    total_count = sum(exercise_counter.values())

    # 월별 요약 변환
    monthly_summary_list = [
        {"month": k, **v} for k, v in sorted(monthly_summary.items())
    ]

    return jsonify({
        "total_duration": total_duration,
        "total_count": total_count,
        "week_labels": sorted_weeks,
        "weekly_durations": weekly_durations,
        "exercise_labels": list(exercise_counter.keys()),
        "exercise_counts": list(exercise_counter.values()),
        "recent_records": recent_records,
        "monthly_summary": monthly_summary_list
    })

@app.route("/export-csv")
def export_csv():
    if not os.path.exists(DATA_PATH):
        return "No data", 400

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    # CSV로 변환
    if not records:
        return "No data", 400

    # CSV 헤더 추출 (모든 키 통합)
    all_keys = set()
    for r in records:
        all_keys.update(r.keys())
    headers = sorted(all_keys)

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    writer.writerows(records)

    mem = BytesIO()
    mem.write(output.getvalue().encode("utf-8-sig"))  # Excel 호환용 BOM 추가
    mem.seek(0)

    return send_file(mem, mimetype="text/csv", as_attachment=True, download_name="records.csv")

@app.route("/save", methods=["POST"])
def save():
    new_record = request.get_json()

    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    records.append(new_record)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success"})


@app.route("/update-record", methods=["POST"])
def update_record():
    data = request.get_json()
    index = data.get("index")
    if index is None:
        return jsonify({"error": "index required"}), 400

    if not os.path.exists(DATA_PATH):
        return jsonify({"error": "no data"}), 400

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    if index < 0 or index >= len(records):
        return jsonify({"error": "invalid index"}), 400

    record = records[index]
    for key, value in data.items():
        if key != "index" and value is not None:
            record[key] = value
    records[index] = record

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success"})


@app.route("/delete-record", methods=["POST"])
def delete_record():
    data = request.get_json()
    index = data.get("index")
    if index is None:
        return jsonify({"error": "index required"}), 400

    if not os.path.exists(DATA_PATH):
        return jsonify({"error": "no data"}), 400

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    if index < 0 or index >= len(records):
        return jsonify({"error": "invalid index"}), 400

    records.pop(index)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success"})


# -------------------------------------------------
# 영상 관리 관련 API
# -------------------------------------------------

def load_videos():
    if not os.path.exists(VIDEO_JSON):
        return []
    with open(VIDEO_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def save_videos(videos):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(VIDEO_JSON, "w", encoding="utf-8") as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)


@app.route("/video-data")
def video_data():
    """저장된 영상 목록을 인덱스와 함께 반환."""
    videos = load_videos()
    return jsonify([{**v, "index": i} for i, v in enumerate(videos)])


@app.route("/add-video", methods=["POST"])
def add_video():
    """영상 메타데이터 저장 및 파일 업로드 처리."""
    videos = load_videos()
    title = request.form.get("title")
    exercise = request.form.get("exercise")
    youtube_url = request.form.get("youtube_url")
    file = request.files.get("video_file")

    entry = {"title": title, "exercise": exercise}

    if file and file.filename:
        os.makedirs(VIDEO_DIR, exist_ok=True)
        filename = secure_filename(file.filename)
        path = os.path.join(VIDEO_DIR, filename)
        file.save(path)
        entry.update({"type": "file", "path": filename})
    elif youtube_url:
        entry.update({"type": "youtube", "url": youtube_url})
    else:
        return jsonify({"error": "No video data"}), 400

    videos.append(entry)
    save_videos(videos)
    return jsonify({"status": "success"})


@app.route("/update-video", methods=["POST"])
def update_video():
    data = request.get_json()
    index = data.get("index")
    videos = load_videos()
    if index is None or index < 0 or index >= len(videos):
        return jsonify({"error": "invalid index"}), 400
    video = videos[index]
    for key in ["title", "exercise", "url"]:
        if key in data and data[key] is not None:
            video[key] = data[key]
    videos[index] = video
    save_videos(videos)
    return jsonify({"status": "success"})


@app.route("/delete-video", methods=["POST"])
def delete_video():
    data = request.get_json()
    index = data.get("index")
    videos = load_videos()
    if index is None or index < 0 or index >= len(videos):
        return jsonify({"error": "invalid index"}), 400
    vid = videos.pop(index)
    if vid.get("type") == "file":
        try:
            os.remove(os.path.join(VIDEO_DIR, vid.get("path")))
        except OSError:
            pass
    save_videos(videos)
    return jsonify({"status": "success"})


@app.route("/video-file/<path:filename>")
def serve_video(filename):
    """저장된 비디오 파일을 스트리밍."""
    return send_from_directory(VIDEO_DIR, filename)


@app.route("/download-video/<path:filename>")
def download_video(filename):
    """비디오 파일 다운로드."""
    return send_from_directory(VIDEO_DIR, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
