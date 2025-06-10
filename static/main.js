// ------------------------------------------------------------
// main.js
// 홈 페이지에서 운동 기록을 작성하고 최근 기록을 보여 주는 스크립트
// 각 함수와 이벤트 처리 부분마다 한국어 주석을 달아 초심자도
// 동작 흐름을 쉽게 파악할 수 있도록 한다.
// ------------------------------------------------------------

// DOM 로딩이 끝난 뒤 실행되는 초기화 함수
document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------------------------------
  // 현재 시각을 한국 표준시(KST) 기준 ISO 문자열로 변환하여
  // datetime-local 입력 필드의 기본값으로 사용한다.
  // ------------------------------------------------------
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const kstNow = new Date(now.getTime() - offsetMs);
  const isoLocal = kstNow.toISOString().slice(0, 16);
  document.getElementById("datetime").value = isoLocal;

  const exerciseSelect = document.getElementById("exercise-select");
  const dynamicInputs = document.getElementById("dynamic-inputs");
  const form = document.getElementById("exercise-form");

  // ------------------------------------------------------
  // 운동 종류 선택 시 필요한 입력 항목을 동적으로 표시한다.
  // 예) 푸시업/스쿼트/런지 -> Reps 입력필드
  //     플랭크 -> Duration 입력필드
  //     런지 -> Direction 선택 필드
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // 폼 제출 시 서버로 기록을 전송하고 최근 목록을 다시 읽어 온다.
  // ------------------------------------------------------
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

  // -----------------------------------------
  // 최근 기록 목록을 서버에서 받아 화면에 표시
  // -----------------------------------------
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

  // -----------------------------------------
  // 간단한 토스트 메시지 표시용 유틸리티
  // -----------------------------------------
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
