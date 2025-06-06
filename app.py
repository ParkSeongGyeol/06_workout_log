from flask import Flask, render_template, request, jsonify, send_file
import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import csv
from io import StringIO, BytesIO
import os
import pytz

app = Flask(__name__)

DATA_DIR = "data"
DATA_PATH = os.path.join(DATA_DIR, "records.json")
KST = pytz.timezone("Asia/Seoul")


@app.route("/")
def home():
    return render_template("home.html")

@app.route("/log")
def log_page():
    return render_template("log.html")

@app.route("/stats")
def stats():
    return render_template("stats.html")

@app.route("/records")
def get_recent_records():
    if not os.path.exists(DATA_PATH):
        return jsonify([])
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)
    # 최신순으로 20개
    recent = sorted(records, key=lambda x: x.get("datetime", ""), reverse=True)[:20]
    return jsonify(recent)

@app.route("/all-records")
def all_records():
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
            start_dt = datetime.fromisoformat(start_date_str)
            end_dt = datetime.fromisoformat(end_date_str) + timedelta(days=1)  # inclusive
        except ValueError:
            return jsonify({"error": "Invalid date format"}), 400
    else:
        # 날짜 없으면 최근 30일로 기본 설정
        now_kst = datetime.now(KST)
        end_dt = now_kst + timedelta(days=1)
        start_dt = end_dt - timedelta(days=30)
        
    # 3. 파일 불러오기
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
        if start_dt <= dt < end_dt:
            r["_datetime_obj"] = dt  # 임시 보관
            filtered.append(r)
    
    # 5. 분석 데이터 생성
    filtered.sort(key=lambda x: x["_datetime_obj"], reverse=True)
    recent_records = [{k: v for k, v in r.items() if k != "_datetime_obj"} for r in filtered[:20]]

    total_duration = 0
    exercise_counter = Counter()
    weekly_data = defaultdict(int)
    monthly_summary = defaultdict(lambda: {"푸시업": 0, "스쿼트": 0, "total_reps": 0, "intensity": 0, "calories": 0})

    today = datetime.now(KST)
    
    for r in filtered:
        dt = r["_datetime_obj"]
        exercise = r.get("exercise", "")
        reps = r.get("reps", 0)
        duration = r.get("duration", 0)

        # 칼로리 계산
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

        # duration 누적
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
