from flask import Flask, render_template, request, jsonify
import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timedelta

app = Flask(__name__)

DATA_PATH = "data/records.json"

@app.route("/")
def home():
    return render_template("input.html")

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
        end_dt = datetime.today() + timedelta(days=1)
        start_dt = end_dt - timedelta(days=30)
        
    # 3. 파일 불러오기
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    # 4. 필터링된 레코드만 추출
    filtered = []
    for r in records:
        try:
            dt = datetime.fromisoformat(r["datetime"])
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

    today = datetime.today()

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

    # 월별 요약 변환
    monthly_summary_list = [
        {"month": k, **v} for k, v in sorted(monthly_summary.items())
    ]

    return jsonify({
        "total_duration": total_duration,
        "week_labels": sorted_weeks,
        "weekly_durations": weekly_durations,
        "exercise_labels": list(exercise_counter.keys()),
        "exercise_counts": list(exercise_counter.values()),
        "recent_records": recent_records,
        "monthly_summary": monthly_summary_list
    })

@app.route("/save", methods=["POST"])
def save():
    new_record = request.get_json()
    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    records.append(new_record)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
