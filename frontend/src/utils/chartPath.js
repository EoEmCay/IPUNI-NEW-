// Đường cong mềm mại qua các điểm (monotone cubic, Fritsch–Carlson): cong như biểu đồ thường
// nhưng KHÔNG vọt lên/lõm xuống quá số đo thật giữa 2 điểm - đọc sai đỉnh/đáy là nguy hiểm
// với số đo đường huyết.
export function monotonePath(points) {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x},${points[0].y}`;
  const dx = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push((points[i + 1].y - points[i].y) / dx[i]);
  }
  const t = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(slope[i - 1] * slope[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) /
      ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]));
  }
  t.push(slope[n - 2]);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${points[i].x + h},${points[i].y + t[i] * h} ${points[i + 1].x - h},${points[i + 1].y - t[i + 1] * h} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

// Bước chia trục "tròn" (1, 2, 5 × 10^k) để có khoảng `count` mốc trên trục
export function niceStep(maxValue, count = 4) {
  const raw = maxValue / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return step;
}
