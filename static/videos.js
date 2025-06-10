// ------------------------------------------------------------
// videos.js
// 영상 관리 페이지 전용 스크립트로 영상 목록을 불러오고
// 업로드, 수정, 삭제, 다운로드 기능을 제공한다.
// ------------------------------------------------------------

let allVideos = [];

// 페이지 로드 후 영상 목록을 받아오고 업로드 폼 이벤트를 연결

document.addEventListener("DOMContentLoaded", () => {
  fetchVideos();
  document.getElementById("video-form").addEventListener("submit", uploadVideo);
});

// 서버에서 영상 목록을 불러와 테이블을 렌더링
// 영상 메타데이터를 서버로부터 가져와 테이블을 그린다
async function fetchVideos() {
  const res = await fetch("/video-data");
  allVideos = await res.json();
  renderTable();
}

// 화면 크기에 맞춰 영상 목록 테이블을 생성
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

// 체크된 영상들의 인덱스 배열 반환
function getSelectedIndices() {
  return Array.from(document.querySelectorAll(".select-box:checked")).map((c) =>
    Number(c.dataset.index)
  );
}

// 업로드 폼 제출 시 호출되어 서버에 영상을 등록
async function uploadVideo(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const progress = document.getElementById("upload-progress");
  progress.style.display = "block";
  progress.value = 0;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/add-video");
  xhr.upload.addEventListener("progress", (evt) => {
    if (evt.lengthComputable) {
      progress.value = (evt.loaded / evt.total) * 100;
    }
  });
  xhr.onload = () => {
    progress.style.display = "none";
    form.reset();
    fetchVideos();
  };
  xhr.onerror = () => {
    progress.style.display = "none";
    alert("Upload failed");
  };
  xhr.send(formData);
}

// 체크된 영상 삭제 요청
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

// 첫 번째로 선택된 영상의 정보를 프롬프트로 수정
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

// 로컬 파일일 경우 선택된 영상 다운로드
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


// 유튜브 주소에서 동영상 ID를 추출
function extractYoutubeID(url) {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : url;
}

window.addEventListener("resize", () => {
  if (!document.fullscreenElement) {
    renderTable();
  }
});
// 화면 크기가 바뀌면 테이블을 다시 그리되 전체화면 시에는 동작하지 않음
