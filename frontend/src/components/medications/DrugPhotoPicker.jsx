import { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, ZoomIn, RefreshCw, Pill } from 'lucide-react';
import {
  getSavedDrugVisual,
  fetchAndCacheDrugVisual,
  saveCustomDrugImage,
  compressUploadedDrugPhoto
} from '../../utils/drugVisuals';

export default function DrugPhotoPicker({ drugName, onVisualChange }) {
  const [visual, setVisual] = useState(() => getSavedDrugVisual(drugName));
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [appearanceText, setAppearanceText] = useState(() => getSavedDrugVisual(drugName).appearance || '');
  const [zoomOpen, setZoomOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (!drugName) return;
    const initial = getSavedDrugVisual(drugName);
    setVisual(initial);
    setAppearanceText(initial.appearance || '');
    setLoadingWeb(true);

    fetchAndCacheDrugVisual(drugName)
      .then((res) => {
        if (!active || !res) return;
        setVisual(res);
        setAppearanceText(res.appearance || '');
        if (onVisualChange) onVisualChange(res);
      })
      .finally(() => {
        if (active) setLoadingWeb(false);
      });

    return () => {
      active = false;
    };
  }, [drugName]);

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !drugName) return;
    const base64 = await compressUploadedDrugPhoto(file);
    if (base64) {
      const updated = saveCustomDrugImage(drugName, base64, {
        isUpload: true,
        appearance: appearanceText
      });
      if (updated) {
        setVisual(updated);
        if (onVisualChange) onVisualChange(updated);
      }
    }
    e.target.value = '';
  };

  const handleAppearanceBlur = () => {
    if (!drugName || !visual?.imageUrl) return;
    const updated = saveCustomDrugImage(drugName, visual.imageUrl, {
      isUpload: visual.isCustomUpload,
      appearance: appearanceText
    });
    if (updated) {
      setVisual(updated);
      if (onVisualChange) onVisualChange(updated);
    }
  };

  return (
    <div
      style={{
        background: '#F0FDF4',
        border: '1.5px solid #BBF7D0',
        borderRadius: 16,
        padding: 14,
        marginBottom: 14
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#166534' }}>
          <Sparkles size={15} />
          <span>HÌNH ẢNH THUỐC HIỂN THỊ KHI NHẮC CỤ UỐNG</span>
        </div>
        {loadingWeb && (
          <span style={{ fontSize: 11, color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
            <RefreshCw size={12} /> Đang tìm ảnh thuốc...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Ảnh chính của hộp/vỉ thuốc */}
        <div
          onClick={() => visual?.imageUrl && setZoomOpen(true)}
          style={{
            position: 'relative',
            width: 104,
            height: 104,
            borderRadius: 14,
            background: '#FFFFFF',
            border: '2px solid #86EFAC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: visual?.imageUrl ? ' pointer' : 'default',
            boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)'
          }}
          title="Chạm để phóng to ảnh thuốc"
        >
          {visual?.imageUrl ? (
            <>
              <img
                src={visual.imageUrl}
                alt={drugName}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#FFF',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <ZoomIn size={10} /> Phóng to
              </span>
            </>
          ) : (
            <Pill size={36} color="#16A34A" />
          )}
        </div>

        {/* Cột thông tin & nút chọn ảnh */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {visual?.commonName && (
            <div
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 800,
                color: '#0369A1',
                background: '#E0F2FE',
                padding: '3px 9px',
                borderRadius: 999,
                marginBottom: 6
              }}
            >
              {visual.commonName}
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Đặc điểm nhận diện cho người lớn tuổi (màu sắc, hình dáng, vị trí để):
            </label>
            <input
              type="text"
              value={appearanceText}
              onChange={(e) => setAppearanceText(e.target.value)}
              onBlur={handleAppearanceBlur}
              placeholder="VD: Viên tròn màu trắng, vỉ bạc để ở ngăn kéo số 1"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F172A',
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: 8
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #86EFAC',
                background: '#DCFCE7',
                color: '#15803D',
                cursor: 'pointer'
              }}
            >
              <Camera size={13} />
              Tải ảnh vỉ thuốc thật ở nhà
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleUploadFile}
            />
          </div>
        </div>
      </div>

      {/* Lightbox phóng to ảnh */}
      {zoomOpen && visual?.imageUrl && (
        <div
          onClick={() => setZoomOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10050,
            background: 'rgba(2, 6, 23, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFF',
              borderRadius: 20,
              padding: 16,
              maxWidth: 400,
              width: '100%',
              textAlign: 'center'
            }}
          >
            <img
              src={visual.imageUrl}
              alt={drugName}
              style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 12 }}
            />
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginTop: 10 }}>
              {drugName}
            </div>
            {appearanceText && (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginTop: 4 }}>
                💊 {appearanceText}
              </div>
            )}
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                background: '#0F172A',
                color: '#FFF',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Đóng ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
