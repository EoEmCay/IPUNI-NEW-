const axios = require('axios');
const crypto = require('crypto');

// Endpoint TTS của Google Dịch (translate.google.com) - KHÔNG PHẢI API chính thức có tài
// liệu, không cần key, không tốn phí. Đây là đúng "giọng chị Google dịch" quen thuộc.
// Rủi ro: Google có thể chặn/đổi bất cứ lúc nào không báo trước vì đây là endpoint nội bộ
// của trang Google Dịch, không phải sản phẩm được công bố cho bên thứ ba dùng. Vì vậy
// route gọi hàm này luôn phải có phương án dự phòng ở phía gọi (frontend rơi về giọng máy
// nếu gọi lỗi) - không được để tính năng nhắc thuốc phụ thuộc hoàn toàn vào đây.
const TTS_ENDPOINT = 'https://translate.google.com/translate_tts';
const MAX_CHUNK_LEN = 180; // giới hạn thực tế của endpoint này, vượt quá dễ bị cắt/lỗi
const MAX_TOTAL_LEN = 600; // chặn lạm dụng - 1 lời nhắc thuốc thực tế không cần dài hơn

// ============================================================================
// CACHE THEO NỘI DUNG (giảm số lần gọi Google TTS):
// Lời nhắc thuốc lặp lại gần như y hệt mỗi ngày ("Đến giờ uống thuốc", tên thuốc cố định)
// nên cache theo hash nội dung giúp CÙNG 1 CÂU chỉ gọi Google đúng 1 lần dù có hàng trăm
// bệnh nhân/hàng nghìn lần nhắc - giảm mạnh nguy cơ bị Google rate-limit/chặn IP server khi
// traffic tăng. Cache trong RAM (Map), giới hạn kích thước + TTL để không phình bộ nhớ vô hạn.
// ============================================================================
const CACHE_MAX_ENTRIES = 300;
const CACHE_TTL_MS = 24 * 3600 * 1000; // 24h - đủ để phủ toàn bộ các lời nhắc lặp lại trong ngày
const audioCache = new Map(); // hash -> { buffer, at }

function cacheKey(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function getCached(text) {
  const key = cacheKey(text);
  const hit = audioCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    audioCache.delete(key);
    return null;
  }
  return hit.buffer;
}

function setCached(text, buffer) {
  const key = cacheKey(text);
  // Đầy cache -> loại bỏ entry cũ nhất (Map giữ thứ tự chèn) trước khi thêm mới
  if (audioCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    audioCache.delete(oldestKey);
  }
  audioCache.set(key, { buffer, at: Date.now() });
}

// Cắt văn bản dài thành nhiều đoạn <= MAX_CHUNK_LEN, ưu tiên cắt ở dấu câu/khoảng trắng
// gần nhất để không cắt ngang giữa từ.
function splitText(text) {
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_LEN) {
      chunks.push(remaining);
      break;
    }
    let cut = remaining.lastIndexOf('. ', MAX_CHUNK_LEN);
    if (cut < 40) cut = remaining.lastIndexOf(', ', MAX_CHUNK_LEN);
    if (cut < 40) cut = remaining.lastIndexOf(' ', MAX_CHUNK_LEN);
    if (cut < 40) cut = MAX_CHUNK_LEN - 1;
    chunks.push(remaining.slice(0, cut + 1).trim());
    remaining = remaining.slice(cut + 1).trim();
  }
  return chunks;
}

async function fetchChunkAudio(chunk) {
  const url = `${TTS_ENDPOINT}?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=vi&client=tw-ob`;
  const resp = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 8000,
    headers: {
      // translate_tts từ chối request không có User-Agent trông giống trình duyệt thật
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Referer: 'https://translate.google.com/',
    },
  });
  return Buffer.from(resp.data);
}

// Trả về 1 Buffer mp3 duy nhất, đã ghép các đoạn (nếu văn bản dài phải chia nhiều đoạn).
// Ghép trực tiếp byte MP3 - không hoàn hảo về mặt kỹ thuật audio nhưng phát được bình
// thường trên trình duyệt cho trường hợp vài câu ngắn nối tiếp như lời nhắc thuốc.
async function synthesizeVietnamese(text) {
  const trimmed = (text || '').toString().trim().slice(0, MAX_TOTAL_LEN);
  if (!trimmed) {
    const err = new Error('Thiếu nội dung cần đọc');
    err.status = 400;
    throw err;
  }

  const cached = getCached(trimmed);
  if (cached) return cached;

  const chunks = splitText(trimmed);
  // Gọi song song thay vì tuần tự: giảm tổng thời gian chờ khi câu dài phải chia nhiều đoạn
  // (trước đây N đoạn = N lần round-trip nối tiếp, có thể mất 15-20s+ trước khi phát được).
  const buffers = await Promise.all(chunks.map(fetchChunkAudio));
  const result = Buffer.concat(buffers);
  setCached(trimmed, result);
  return result;
}

module.exports = { synthesizeVietnamese };
