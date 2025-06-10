// 관리 페이지에서 기록을 조회/수정/삭제하는 스크립트
// 화면 크기에 따라 테이블 형태를 변경하며, 체크박스로 선택된
// 항목에 대해 일괄 편집 또는 삭제를 수행한다.

let allRecords = [];

// 페이지 로드 시 데이터 조회
document.addEventListener("DOMContentLoaded", () => {
  fetchRecords();
  // 화면 크기가 변경되면 테이블을 다시 그린다.
  window.addEventListener("resize", renderTable);
});

// 서버에서 모든 기록을 받아 온다.
async function fetchRecords() {
  const res = await fetch("/all-records");
  const data = await res.json();
  allRecords = data;
  // 최근 기록이 위에 오도록 날짜 기준 정렬
  allRecords.sort((a, b) => (b.datetime || "").localeCompare(a.datetime || ""));
  renderTable();
}

// 현재 화면 크기에 맞춰 테이블을 렌더링한다.
function renderTable() {
  const container = document.getElementById("record-table");
  if (!allRecords.length) {
    container.innerHTML = "<p>No records.</p>";
    return;
  }

  const isMobile = window.innerWidth <= 600;

  const rows = allRecords
    .map((r) => {
      const checkbox = `<input type="checkbox" class="select-box" data-index="${r.index}">`;
      if (isMobile) {
        // 모바일에서는 필요한 정보만 한 셀에 표시
        return `
          <tr>
            <td>${checkbox}</td>
            <td class="mobile-cell">
              <div>${r.datetime || "-"}</div>
              <div>${r.exercise || "-"}</div>
              ${r.reps ? `<div>Reps: ${r.reps}</div>` : ""}
              ${r.duration ? `<div>Duration: ${r.duration}</div>` : ""}
              ${r.direction ? `<div>Direction: ${r.direction}</div>` : ""}
              ${r.note ? `<div>${r.note}</div>` : ""}
            </td>
          </tr>`;
      }
      return `
        <tr>
          <td>${checkbox}</td>
          <td>${r.datetime || "-"}</td>
          <td>${r.exercise || "-"}</td>
          <td>${r.reps || "-"}</td>
          <td>${r.duration || "-"}</td>
          <td>${r.direction || "-"}</td>
          <td>${r.note || ""}</td>
        </tr>`;
    })
    .join("");

  const header = isMobile
    ? `<tr><th>Select</th><th>Record</th></tr>`
    : `<tr><th>Select</th><th>Date</th><th>Exercise</th><th>Reps</th><th>Duration</th><th>Direction</th><th>Note</th></tr>`;

  container.innerHTML = `
    <table>
      <thead>${header}</thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="table-actions">
      <button id="edit-btn">Edit</button>
      <button id="delete-btn">Delete</button>
    </div>`;

  document.getElementById("edit-btn").addEventListener("click", editSelected);
  document.getElementById("delete-btn").addEventListener("click", deleteSelected);
}

// 선택된 체크박스의 인덱스 배열을 반환
function getSelectedIndices() {
  return Array.from(document.querySelectorAll(".select-box:checked")).map((c) =>
    Number(c.dataset.index)
  );
}

// 선택된 기록 삭제
function deleteSelected() {
  const indices = getSelectedIndices();
  if (!indices.length) {
    alert("선택된 기록이 없습니다.");
    return;
  }
  if (!confirm("삭제하시겠습니까?")) return;

  Promise.all(
    indices.map((i) =>
      fetch("/delete-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: i }),
      })
    )
  ).then(fetchRecords);
}

// 선택된 기록 편집 (한 개만 가능)
function editSelected() {
  const indices = getSelectedIndices();
  if (indices.length !== 1) {
    alert("하나의 기록만 선택해 주세요.");
    return;
  }

  const idx = indices[0];
  const r = allRecords.find((rec) => rec.index === idx);
  if (!r) return;

  const datetime = prompt("Datetime", r.datetime) || r.datetime;
  const exercise = prompt("Exercise", r.exercise) || r.exercise;

  let reps = r.reps;
  let duration = r.duration;
  let direction = r.direction;

  if (["푸시업", "스쿼트", "런지"].includes(exercise)) {
    const val = prompt("Reps", r.reps || "");
    if (val !== null) reps = Number(val);
  }
  if (exercise === "플랭크") {
    const val = prompt("Duration (sec)", r.duration || "");
    if (val !== null) duration = Number(val);
  }
  if (exercise === "런지") {
    const val = prompt("Direction", r.direction || "양쪽");
    if (val !== null) direction = val;
  }

  const note = prompt("Note", r.note || "") || r.note;
  const data = { index: idx, datetime, exercise, reps, duration, direction, note };

  fetch("/update-record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(fetchRecords);
}

