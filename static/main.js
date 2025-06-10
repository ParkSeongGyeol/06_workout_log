// 홈 화면의 동작을 담당하는 스크립트
document.addEventListener("DOMContentLoaded", () => {
  // 현재 시간을 KST 기준으로 설정
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const kstNow = new Date(now.getTime() - offsetMs);
  const isoLocal = kstNow.toISOString().slice(0, 16);
  document.getElementById("datetime").value = isoLocal;

  const exerciseSelect = document.getElementById("exercise-select");
  const dynamicInputs = document.getElementById("dynamic-inputs");
  const form = document.getElementById("exercise-form");

  // 운동 종류별 입력 필드 렌더링
  exerciseSelect.addEventListener("change", () => {
    const selected = exerciseSelect.value;
    dynamicInputs.innerHTML = "";

    if (selected === "푸시업" || selected === "스쿼트" || selected === "런지") {
      dynamicInputs.innerHTML += `
        <div class="form-group">
          <label>Reps</label>
          <input type="number" name="reps" required />
        </div>`;
    }

    if (selected === "플랭크") {
      dynamicInputs.innerHTML += `
        <div class="form-group">
          <label>Duration (seconds)</label>
          <input type="number" name="duration" required />
        </div>`;
    }

    if (selected === "런지") {
      dynamicInputs.innerHTML += `
        <div class="form-group">
          <label>Direction</label>
          <select name="direction">
            <option value="양쪽">양쪽</option>
            <option value="왼쪽">왼쪽</option>
            <option value="오른쪽">오른쪽</option>
          </select>
        </div>`;
    }
  });

  // 저장 처리
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const datetime = formData.get("datetime");
    const exercise = formData.get("exercise");

    let data = {
      datetime: datetime,
      exercise: exercise,
    };

    // 운동별 입력값 설정
    switch (exercise) {
      case "푸시업":
      case "스쿼트":
      case "풀업":
        data.reps = Number(formData.get("reps"));
        break;
      case "플랭크":
        data.duration = Number(formData.get("duration"));
        break;
      case "런지":
        data.reps = Number(formData.get("reps"));
        data.direction = formData.get("direction");
        break;
    }

    await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    alert("운동 기록이 저장되었습니다.");
    form.reset();

    // 다시 현재 KST로 기본값 설정
    const resetNow = new Date();
    const resetKST = new Date(
      resetNow.getTime() - resetNow.getTimezoneOffset() * 60000
    );
    document.getElementById("datetime").value = resetKST
      .toISOString()
      .slice(0, 16);
    dynamicInputs.innerHTML = "";
    fetchRecentRecords();
  });

  // 최근 기록 불러오기
  async function fetchRecentRecords() {
    const res = await fetch("/records");
    const records = await res.json();

    const container = document.getElementById("recent-records");
    container.innerHTML =
      "<ul>" +
      records
        .map((r) => {
          let detail = `${r.exercise} - `;
          if (r.reps) detail += `${r.reps}회 `;
          if (r.duration) detail += `${r.duration}초 `;
          if (r.direction) detail += `(${r.direction}) `;
          return `<li>${r.datetime} | ${detail}</li>`;
        })
        .join("") +
      "</ul>";
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "2rem";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.backgroundColor = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "0.75rem 1.25rem";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "1000";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  fetchRecentRecords();
});
