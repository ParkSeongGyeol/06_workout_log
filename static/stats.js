document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/stats-data");
  const data = await res.json();

  // 운동 종류별 빈도 그래프
  const barCtx = document.getElementById("barChart").getContext("2d");
  new Chart(barCtx, {
    type: "bar",
    data: {
      labels: data.exercise_labels,
      datasets: [{
        label: '운동 횟수',
        data: data.exercise_counts
      }]
    }
  });

  // 월별 운동 비중 원형차트
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: data.month_labels,
      datasets: [{
        label: '월별 운동 비율',
        data: data.month_counts
      }]
    }
  });
});
