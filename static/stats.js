// 통계 데이터를 서버에서 받아와 각종 차트를 갱신한다.
async function loadStats(start = "", end = "") {
  let url = "/stats-data";
  if (start && end) {
    url += `?start=${start}&end=${end}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  renderWorkoutChart(data.week_labels, data.weekly_durations);
  renderExerciseChart(data.exercise_labels, data.exercise_counts);
  renderRecentRecords(data.recent_records);
  renderMonthlySummary(data.monthly_summary);
  renderTotalDuration(data.total_duration);
  renderTotalCount(data.total_count);

  renderExtraCharts(
    data.monthly_summary,
    data.exercise_counts,
    data.exercise_labels
  );
}

function renderWorkoutChart(labels, data) {
  const canvas = document.getElementById("lineChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (window.workoutChart) window.workoutChart.destroy();
  window.workoutChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Workout Duration (min)",
          data: data.map((v) => (v / 60).toFixed(1)),
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          fill: true,
          tension: 0.2,
        },
      ],
    },
  });
}

function renderExerciseChart(labels, data) {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (window.exerciseChart) window.exerciseChart.destroy();
  window.exerciseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Exercise Frequency",
          data: data,
          backgroundColor: "#28a745",
        },
      ],
    },
  });
}

function renderRecentRecords(records) {
  const table = document.getElementById("record-table");
  if (!records || records.length === 0) {
    table.innerHTML = "<p>No recent records.</p>";
    return;
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Exercise</th>
          <th>Reps</th>
          <th>Duration</th>
          <th>Direction</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${records
          .map(
            (r) => `
          <tr>
            <td>${r.datetime || "-"}</td>
            <td>${r.exercise || "-"}</td>
            <td>${r.reps || "-"}</td>
            <td>${r.duration || "-"}</td>
            <td>${r.direction || "-"}</td>
            <td>${r.note || ""}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
  table.innerHTML = html;
}

function renderTotalDuration(seconds) {
  const el = document.getElementById("total-duration");
  if (!el) return;
  el.textContent = (seconds / 60).toFixed(1);
}

function renderTotalCount(count) {
  const el = document.getElementById("total-count");
  if (!el) return;
  el.textContent = count;
}

function getIntensityLevel(intensity) {
  if (intensity < 100) return { level: "Low", color: "green" };
  if (intensity < 200) return { level: "Moderate", color: "orange" };
  return { level: "High", color: "red" };
}

function renderMonthlySummary(summary) {
  const table = document.getElementById("monthly-table");
  if (!summary || summary.length === 0) {
    table.innerHTML = "<p>No data available for selected range.</p>";
    return;
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Push-ups</th>
          <th>Squats</th>
          <th>Total Reps</th>
          <th>Intensity Level</th>
          <th>Calories Burned</th>
        </tr>
      </thead>
      <tbody>
        ${summary
          .map((row) => {
            const intensityInfo = getIntensityLevel(row.intensity);
            return `
            <tr>
              <td>${row.month}</td>
              <td>${row["푸시업"] || 0}</td>
              <td>${row["스쿼트"] || 0}</td>
              <td>${row.total_reps}</td>
              <td style="color: ${intensityInfo.color}; font-weight: bold;">
                ${intensityInfo.level}
              </td>
              <td>${row.calories.toFixed(1)}</td>
            </tr>
          `;
          })
          .join("")}
      </tbody>
    </table>
  `;
  table.innerHTML = html;
}

// 날짜 필터 버튼 이벤트
document.getElementById("filter-btn").addEventListener("click", () => {
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;
  if (start && end) {
    loadStats(start, end);
  }
});

let repsChart, ratioChart;

function renderExtraCharts(monthlyData, exerciseCounts, exerciseLabels) {
  const ctx1 = document.getElementById("monthlyRepsChart").getContext("2d");
  const ctx2 = document.getElementById("exerciseRatioChart").getContext("2d");

  // 월별 반복 수 변화 (막대그래프)
  const months = monthlyData.map((d) => d.month);
  const reps = monthlyData.map((d) => d.total_reps);

  if (repsChart) repsChart.destroy();
  repsChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Total Reps per Month",
          data: reps,
          backgroundColor: "#3498db",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  // 운동 비율 (파이차트)
  if (ratioChart) ratioChart.destroy();
  ratioChart = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: exerciseLabels,
      datasets: [
        {
          data: exerciseCounts,
          backgroundColor: [
            "#1abc9c",
            "#e74c3c",
            "#9b59b6",
            "#f1c40f",
            "#2ecc71",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

// 초기 로딩
loadStats();
