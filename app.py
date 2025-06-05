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



@app.route("/records")
def get_recent_records():
    if not os.path.exists(DATA_PATH):
        return jsonify([])

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    # 최신순으로 20개
    recent = sorted(records, key=lambda x: x.get("datetime", ""), reverse=True)[:20]
    return jsonify(recent)


@app.route("/stats")
def stats():
    return render_template("stats.html")

@app.route("/stats-data")
def stats_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    records.sort(key=lambda r: r["datetime"], reverse=True)
    today = datetime.today()
    cutoff_30days = today - timedelta(days=30)

    total_duration = 0
    exercise_counter = Counter()
    monthly_summary = defaultdict(lambda: {"푸시업": 0, "스쿼트": 0, "total_reps": 0, "intensity": 0, "calories": 0})
    recent_records = records[:20]
    weekly_data = defaultdict(int)

    for r in records:
        dt = datetime.fromisoformat(r["datetime"])
        ym = dt.strftime("%Y-%m")
        exercise = r.get("exercise", "")
        reps = r.get("reps", 0)
        duration = r.get("duration", 0)

        if exercise == "푸시업":
            calories = reps * 0.4
        elif exercise == "스쿼트":
            calories = reps * 0.5
        else:
            calories = 0

        monthly_summary[ym][exercise] += reps
        monthly_summary[ym]["total_reps"] += reps
        monthly_summary[ym]["calories"] += calories
        monthly_summary[ym]["intensity"] += reps

        if duration:
            total_duration += duration
        elif exercise in ["푸시업", "스쿼트"]:
            total_duration += reps * 2

        if dt >= cutoff_30days:
            week_label = f"Week {((today - dt).days) // 7 + 1}"
            weekly_data[week_label] += reps * 2

        exercise_counter[exercise] += 1

    sorted_week_labels = sorted(weekly_data.keys(), key=lambda w: int(w.split()[1]))
    weekly_durations = [weekly_data[w] for w in sorted_week_labels]

    monthly_summary_list = [
        {"month": k, **v}
        for k, v in sorted(monthly_summary.items())
    ]

    return jsonify({
        "total_duration": total_duration,
        "week_labels": sorted_week_labels,
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
