document.addEventListener("DOMContentLoaded", async () => {

  async function loadStats(start = "", end = "") {
    let url = "/stats-data";
    if (start && end) {
      url += `?start=${start}&end=${end}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    renderStats(data);  // 기존 렌더링 로직 묶어두기
  }

  document.getElementById("filter-btn").addEventListener("click", () => {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    if (start && end) loadStats(start, end);
  });

  // 초기 호출
  loadStats();


  // 총 운동 시간 계산
  const totalMinutes = data.total_duration || 0;
  document.getElementById("total-duration").textContent = `${totalMinutes} min`;

  const totalCount = data.exercise_counts.reduce((a, b) => a + b, 0);
  document.getElementById("total-count").textContent = totalCount;

  // 선 그래프: 주별 운동량
  new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: data.week_labels,
      datasets: [{
        label: "Minutes",
        data: data.weekly_durations,
        fill: false,
        borderColor: "#3366ff"
      }]
    }
  });

  // 막대 그래프: 운동 종류별 횟수
  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: data.exercise_labels,
      datasets: [{
        label: "Frequency",
        data: data.exercise_counts,
        backgroundColor: "#99ccff"
      }]
    }
  });

  // 최근 기록 테이블 출력
  const table = document.getElementById("record-table");
  table.innerHTML = "<table><thead><tr><th>Date</th><th>Type</th><th>Duration</th><th>Reps</th><th>Note</th></tr></thead><tbody>" +
    data.recent_records.map(r => `
      <tr>
        <td>${r.datetime?.slice(0, 10) || "-"}</td>
        <td>${r.exercise}</td>
        <td>${r.duration || "-"}</td>
        <td>${r.reps || "-"}</td>
        <td>${r.note || ""}</td>
      </tr>
    `).join("") + "</tbody></table>";
});
