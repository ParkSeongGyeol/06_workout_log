let allRecords = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchRecords();
});

async function fetchRecords() {
  const res = await fetch("/all-records");
  const data = await res.json();
  allRecords = data;
  allRecords.sort((a, b) => (b.datetime || "").localeCompare(a.datetime || ""));
  renderTable();
}

function renderTable() {
  const container = document.getElementById("record-table");
  if (!allRecords.length) {
    container.innerHTML = "<p>No records.</p>";
    return;
  }

  const rows = allRecords
    .map(
      (r, idx) => `
        <tr>
          <td>${r.datetime || "-"}</td>
          <td>${r.exercise || "-"}</td>
          <td>${r.reps || "-"}</td>
          <td>${r.duration || "-"}</td>
          <td>${r.direction || "-"}</td>
          <td>${r.note || ""}</td>
          <td>
            <button onclick="editRecord(${idx})">Edit</button>
            <button onclick="deleteRecord(${idx})">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Exercise</th>
          <th>Reps</th>
          <th>Duration</th>
          <th>Direction</th>
          <th>Note</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function deleteRecord(index) {
  if (!confirm("Delete this record?")) return;
  fetch("/delete-record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  }).then(fetchRecords);
}

function editRecord(index) {
  const r = allRecords[index];
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

  const data = { index, datetime, exercise, reps, duration, direction, note };
  fetch("/update-record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(fetchRecords);
}
