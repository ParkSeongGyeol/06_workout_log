from flask import Flask, render_template, request, jsonify
import json
import os
from collections import Counter
from datetime import datetime

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
    if not os.path.exists(DATA_PATH):
        return jsonify({
            "exercise_labels": [],
            "exercise_counts": [],
            "month_labels": [],
            "month_counts": []
        })


    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    # 운동 종류 카운트
    exercise_counter = Counter(r["exercise"] for r in records if "exercise" in r)

    # 월별 카운트
    month_counter = Counter()
    for r in records:
        dt_str = r.get("datetime")
        if dt_str:
            try:
                dt = datetime.fromisoformat(dt_str)
                label = dt.strftime("%Y-%m")
                month_counter[label] += 1
            except ValueError:
                continue

    return jsonify({
        "exercise_labels": list(exercise_counter.keys()),
        "exercise_counts": list(exercise_counter.values()),
        "month_labels": list(month_counter.keys()),
        "month_counts": list(month_counter.values())
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
