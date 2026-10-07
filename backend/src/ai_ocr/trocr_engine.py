"""TrOCR (microsoft/trocr-base-handwritten) đọc chữ viết tay theo từng dòng.

    .venv/bin/python trocr_engine.py anh1.jpg [anh2.png ...]   -> in 1 dòng JSON / ảnh
JSON: {"image", "lines": [{"text", "corrected", "box"}], "medications": [...], "seconds"}

Nạp model 1 lần cho cả lô ảnh (nạp mất ~10 giây). Model chỉ học chữ viết tay tiếng Anh (IAM):
chữ tiếng Việt có dấu sẽ bị đọc thành chữ không dấu / sai - đây là giới hạn của model gốc.
"""
import json
import sys
import time

import cv2
import numpy as np
from PIL import Image

from medical_matcher import correct_line, parse_medications

MODEL_ID = 'microsoft/trocr-base-handwritten'
MIN_LINE_HEIGHT = 12   # px sau khi chuẩn hoá chiều rộng - mảnh nhỏ hơn là nhiễu / dấu chấm
WORK_WIDTH = 1200      # phóng ảnh về cùng chiều rộng để ngưỡng tách dòng ổn định

_processor = _model = _device = None


def load_model():
    global _processor, _model, _device
    if _model is None:
        import torch
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        _device = 'mps' if torch.backends.mps.is_available() else 'cpu'
        _processor = TrOCRProcessor.from_pretrained(MODEL_ID)
        _model = VisionEncoderDecoderModel.from_pretrained(MODEL_ID).to(_device).eval()
    return _processor, _model


def preprocess(bgr):
    """-> (ảnh xám đã làm rõ nét để đọc, ảnh nhị phân để tách dòng). Đã chỉnh nghiêng."""
    scale = WORK_WIDTH / bgr.shape[1]
    bgr = cv2.resize(bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, h=12)                       # khử nhiễu hạt / JPEG
    gray = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)  # mực nhạt -> đậm hơn
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 15)
    binary = remove_rule_lines(binary)

    angle = estimate_skew(binary)
    if abs(angle) > 0.3:
        h, w = gray.shape
        rot = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
        gray = cv2.warpAffine(gray, rot, (w, h), flags=cv2.INTER_CUBIC, borderValue=255)
        binary = cv2.warpAffine(binary, rot, (w, h), flags=cv2.INTER_NEAREST, borderValue=0)
    return gray, binary


def remove_rule_lines(binary):
    """Xoá đường kẻ dài (mép giấy, viền bảng, gạch chân): ảnh chụp thật có các đường dọc chạy qua
    mọi hàng làm cả trang bị coi là 1 dòng. Nét chữ ngắn hơn nhiều nên không bị xoá."""
    h, w = binary.shape
    vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(h // 12, 40))))
    horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (max(w // 6, 60), 1)))
    lines = cv2.dilate(cv2.bitwise_or(vertical, horizontal), np.ones((3, 3), np.uint8))
    return cv2.bitwise_and(binary, cv2.bitwise_not(lines))


def estimate_skew(binary):
    """Góc nghiêng (độ) làm các dòng chữ thẳng nhất: thử từng góc, chọn góc có hình chiếu ngang 'nhọn' nhất."""
    small = cv2.resize(binary, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)
    h, w = small.shape
    best, best_score = 0.0, -1
    for angle in np.arange(-8, 8.01, 0.5):
        rot = cv2.warpAffine(small, cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0), (w, h))
        score = np.var(rot.sum(axis=1))
        if score > best_score:
            best, best_score = angle, score
    return float(best)


def segment_lines(binary):
    """Tách dòng theo hình chiếu ngang (đếm điểm mực mỗi hàng). Trả [(x, y, w, h)] từ trên xuống."""
    # Nối nét trong cùng dòng để dòng thành 1 khối liền, bỏ hàng gần như trắng.
    joined = cv2.dilate(binary, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 3)))
    ink = joined.sum(axis=1) / 255
    # Ngưỡng tương đối: nền = mức mực của 10% hàng ít mực nhất (viền giấy nghiêng, bóng, đường kẻ
    # còn sót luôn có mặt ở mọi hàng của ảnh chụp thật) + 2% chiều rộng. Ảnh scan sạch thì nền ~ 0.
    rows = ink > np.percentile(ink, 10) + max(8, 0.02 * binary.shape[1])
    boxes, start = [], None
    for y, on in enumerate(list(rows) + [False]):
        if on and start is None:
            start = y
        elif not on and start is not None:
            if y - start >= MIN_LINE_HEIGHT:
                band = binary[start:y]
                cols = np.where(band.sum(axis=0) > 0)[0]
                if len(cols):
                    x0, x1 = max(cols[0] - 8, 0), min(cols[-1] + 8, binary.shape[1])
                    boxes.append((int(x0), max(start - 6, 0), int(x1 - x0), y - start + 12))
            start = None
    return boxes


def recognize_lines(gray, boxes, batch_size=8):
    """Đọc từng dòng đã cắt. TrOCR nhận ảnh RGB 1 dòng chữ."""
    import torch
    processor, model = load_model()
    crops = [Image.fromarray(gray[y:y + h, x:x + w]).convert('RGB') for x, y, w, h in boxes]
    texts = []
    for i in range(0, len(crops), batch_size):
        pixel_values = processor(images=crops[i:i + batch_size], return_tensors='pt').pixel_values.to(_device)
        with torch.no_grad():
            ids = model.generate(pixel_values, max_new_tokens=48, num_beams=3)
        texts += processor.batch_decode(ids, skip_special_tokens=True)
    return [t.strip() for t in texts]


def recognize_line(image_patch):
    """1 ảnh dòng chữ (PIL / numpy xám) -> chuỗi."""
    gray = np.array(image_patch.convert('L')) if isinstance(image_patch, Image.Image) else image_patch
    h, w = gray.shape[:2]
    return recognize_lines(gray, [(0, 0, w, h)])[0]


def parse_full_prescription(image_path):
    started = time.time()
    bgr = cv2.imread(str(image_path))
    if bgr is None:
        raise ValueError(f'Không đọc được ảnh: {image_path}')
    gray, binary = preprocess(bgr)
    boxes = segment_lines(binary)
    texts = recognize_lines(gray, boxes) if boxes else []
    lines = []
    for text, box in zip(texts, boxes):
        corrected, _ = correct_line(text)
        lines.append({'text': text, 'corrected': corrected, 'box': box})
    return {
        'image': str(image_path),
        'lines': lines,
        'medications': parse_medications([l['corrected'] for l in lines]),
        'seconds': round(time.time() - started, 2),
    }


if __name__ == '__main__':
    load_model()
    for path in sys.argv[1:]:
        try:
            print(json.dumps(parse_full_prescription(path), ensure_ascii=False), flush=True)
        except Exception as e:  # 1 ảnh lỗi không làm hỏng cả lô
            print(json.dumps({'image': path, 'error': str(e)}, ensure_ascii=False), flush=True)
