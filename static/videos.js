// 영상 관리 페이지 전용 스크립트
// 영상 목록 조회/업로드/수정/삭제 등을 처리한다.

let allVideos = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchVideos();
  document.getElementById("video-form").addEventListener("submit", uploadVideo);
});

// 서버에서 영상 목록을 불러와 테이블을 렌더링
async function fetchVideos() {
  const res = await fetch("/video-data");
  allVideos = await res.json();
  renderTable();
}

function renderTable() {
  const container = document.getElementById("video-table");
  if (!allVideos.length) {
    container.innerHTML = "<p>No videos.</p>";
    return;
  }
  const isMobile = window.innerWidth <= 600;
  const rows = allVideos
    .map((v) => {
      const checkbox = `<input type="checkbox" class="select-box" data-index="${v.index}">`;
      const preview =
        v.type === "youtube"
          ? `<iframe width="200" height="120" src="https://www.youtube.com/embed/${extractYoutubeID(v.url)}" allowfullscreen></iframe>`
          : `<video width="200" height="120" controls src="/video-file/${v.path}"></video>`;
      if (isMobile) {
        return `
          <tr>
            <td>${checkbox}</td>
            <td class="mobile-cell">
              <div>${v.exercise}</div>
              <div>${v.title}</div>
              <div>${preview}</div>
            </td>
          </tr>`;
      }
      return `
        <tr>
          <td>${checkbox}</td>
          <td>${v.exercise}</td>
          <td>${v.title}</td>
          <td>${preview}</td>
        </tr>`;
    })
    .join("");

  const header = isMobile
    ? `<tr><th>Select</th><th>Video</th></tr>`
    : `<tr><th>Select</th><th>Exercise</th><th>Title</th><th>Preview</th></tr>`;

  container.innerHTML = `
    <table>
      <thead>${header}</thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="table-actions">
      <button id="edit-btn">Edit</button>
      <button id="delete-btn">Delete</button>
      <button id="download-btn">Download</button>
    </div>`;

  document.getElementById("edit-btn").addEventListener("click", editSelected);
  document.getElementById("delete-btn").addEventListener("click", deleteSelected);
  document.getElementById("download-btn").addEventListener("click", downloadSelected);
}

function getSelectedIndices() {
  return Array.from(document.querySelectorAll(".select-box:checked")).map((c) =>
    Number(c.dataset.index)
  );
}

// 영상 업로드
async function uploadVideo(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  await fetch("/add-video", {
    method: "POST",
    body: formData,
  });
  form.reset();
  fetchVideos();
}

// 선택된 영상 삭제
function deleteSelected() {
  const indices = getSelectedIndices();
  if (!indices.length) {
    alert("선택된 영상이 없습니다.");
    return;
  }
  if (!confirm("삭제하시겠습니까?")) return;
  Promise.all(
    indices.map((i) =>
      fetch("/delete-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: i }),
      })
    )
  ).then(fetchVideos);
}

// 선택된 영상 정보 수정 (첫 번째만)
function editSelected() {
  const indices = getSelectedIndices();
  if (indices.length !== 1) {
    alert("하나의 영상만 선택해 주세요.");
    return;
  }
  const idx = indices[0];
  const v = allVideos.find((vid) => vid.index === idx);
  if (!v) return;
  const title = prompt("Title", v.title) || v.title;
  const exercise = prompt("Exercise", v.exercise) || v.exercise;
  let youtube_url = v.url;
  if (v.type === "youtube") {
    const val = prompt("YouTube URL", v.url || "");
    if (val !== null) youtube_url = val;
  }
  const data = { index: idx, title, exercise };
  if (v.type === "youtube") data.url = youtube_url;
  fetch("/update-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(fetchVideos);
}

// 선택된 영상 다운로드 (로컬 파일만)
function downloadSelected() {
  const indices = getSelectedIndices();
  if (indices.length !== 1) {
    alert("다운로드할 하나의 영상을 선택해 주세요.");
    return;
  }
  const idx = indices[0];
  const v = allVideos.find((vid) => vid.index === idx);
  if (!v || v.type !== "file") {
    alert("다운로드 가능한 파일이 아닙니다.");
    return;
  }
  window.location.href = `/download-video/${v.path}`;
}

// 유튜브 링크에서 ID 추출
function extractYoutubeID(url) {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : url;
}

window.addEventListener("resize", renderTable);
