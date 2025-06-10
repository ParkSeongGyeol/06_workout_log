// CSV 내보내기 버튼 처리
document.getElementById("export-csv-btn").addEventListener("click", () => {
  fetch("/export-csv")
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "records.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
});
