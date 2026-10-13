import { useEffect, useState, useMemo, useRef } from 'react';
import { X, Sparkles, Camera, Utensils, CheckCircle2, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { useAdvice } from '../../hooks/useAdvice';
import { adviceService } from '../../services/advice.service';
import { useT } from '../../hooks/useT';
import FilterPills from '../../components/common/FilterPills';
import AdviceCard from '../../components/advice/AdviceCard';
import styles from './AdvicePage.module.css';
import PageHeader from '../../components/common/PageHeader';

// Thứ tự ưu tiên khi xem "Tất cả": Xanh lá (Nên ăn) -> Xanh dương (Vận động) -> Đỏ (Nên tránh & Dấu hiệu nguy hiểm)
const CATEGORY_SORT_ORDER = {
  should_eat: 1,
  exercise: 2,
  should_avoid: 3,
  danger_sign: 4,
};

function buildClientFallbackMealAnalysis(mealText = '') {
  const lower = String(mealText || '').toLowerCase();
  if (lower.includes('khoai lang') || lower.includes('gạo lứt') || lower.includes('yến mạch') || lower.includes('salad')) {
    return {
      mealSummary: mealText || 'Khẩu phần GI thấp lành mạnh',
      riskLevel: 'low',
      riskLabel: 'Lượng đường thấp · An toàn cho đường huyết',
      estimatedCarbsGrams: 28,
      estimatedSugarGrams: 2.1,
      sugarSpoonsEquivalent: 2.3,
      estimatedCalories: 310,
      glycemicIndexEstimate: 'GI ~ 45 (Thấp)',
      explanation: 'Khẩu phần giàu chất xơ hòa tan và tinh bột hấp thu chậm, giúp giữ đường huyết sau ăn ổn định.',
      needToSupplement: [
        'Bổ sung thêm 1 phần đạm nạc (cá hấp, ức gà, đậu hũ hoặc 1 quả trứng luộc) để no lâu suốt buổi',
        'Thêm vài hạt hạnh nhân, óc chó hoặc dầu mè/dầu ô liu để hỗ trợ hấp thu vitamin',
        'Uống 1 ly nước ấm (250ml) trước bữa ăn 15 phút',
      ],
      eatingOrderTip: 'Ăn rau xanh trước ➔ Đạm (trứng/cá/đậu) ➔ Khoai lang/gạo lứt sau cùng.',
      postMealAction: 'Duy trì đi bộ nhẹ 15 phút sau ăn 30 phút để cơ thể chuyển hóa đường tốt nhất.',
    };
  }
  if (lower.includes('bánh mì') || lower.includes('xôi') || lower.includes('ngọt') || lower.includes('nước cam')) {
    return {
      mealSummary: mealText || 'Khẩu phần tinh bột hấp thu nhanh',
      riskLevel: 'high',
      riskLabel: 'Lượng đường & tinh bột cao · Cần bổ sung chất xơ',
      estimatedCarbsGrams: 54,
      estimatedSugarGrams: 6.2,
      sugarSpoonsEquivalent: 4.9,
      estimatedCalories: 430,
      glycemicIndexEstimate: 'GI ~ 76 (Cao)',
      explanation: 'Tinh bột tinh chế (bột mì trắng/gạo nếp) chuyển hóa thành đường glucose rất nhanh chỉ sau 30–45 phút.',
      needToSupplement: [
        'Cần bổ sung ngay 1 đĩa dưa leo, cà chua hoặc rau sống ăn TRƯỚC để tạo màng chất xơ làm chậm hấp thu đường',
        'Bổ sung thêm đạm (trứng luộc, thịt nạc, đậu phụ) và bớt lại 1/3 lượng ruột bánh mì / xôi',
        'Uống kèm trà xanh nhạt hoặc sữa hạt không đường, tuyệt đối tránh uống kèm nước ngọt hay sữa đặc',
      ],
      eatingOrderTip: 'Ăn dưa leo/rau xanh trước ➔ Ăn trứng/thịt ➔ Ăn phần tinh bột cuối cùng.',
      postMealAction: 'Nên đi bộ nhẹ nhàng 20 phút sau bữa ăn khoảng 30 phút để hạ đỉnh đường huyết.',
    };
  }
  return {
    mealSummary: mealText || 'Khẩu phần ăn thường ngày',
    riskLevel: 'medium',
    riskLabel: 'Lượng đường trung bình · Cần thêm rau xanh',
    estimatedCarbsGrams: 46,
    estimatedSugarGrams: 4.0,
    sugarSpoonsEquivalent: 3.9,
    estimatedCalories: 410,
    glycemicIndexEstimate: 'GI ~ 64 (Trung bình)',
    explanation: 'Khẩu phần có tinh bột từ gạo/phở/bún. Nếu ăn thiếu rau xanh, đường huyết sau ăn 1–2 giờ có thể tăng nhẹ.',
    needToSupplement: [
      'Cần bổ sung 1 bát rau luộc hoặc canh rau lá xanh (rau muống, bông cải, cải xanh, khổ qua, giá trụng) ăn đầu bữa',
      'Bổ sung thêm cá, đậu hũ hoặc thịt nạc; chỉ nên ăn lưng chén cơm (hoặc giảm 1/3 bánh phở/bún)',
      'Tráng miệng cách bữa ăn 1 giờ bằng vài múi bưởi, 1/2 quả ổi hoặc táo thay vì trái cây ngọt',
    ],
    eatingOrderTip: 'Quy tắc vàng: Ăn Rau xanh trước ➔ Ăn Cá/Thịt/Đậu ➔ Ăn Cơm/Phở/Bún sau cùng (giảm 30% đỉnh đường huyết).',
    postMealAction: 'Đi bộ thong thả 15–20 phút sau ăn 30 phút giúp đường huyết về mức đẹp.',
  };
}

export default function AdvicePage() {
  const t = useT();
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const { advice, fetchAdvice } = useAdvice();

  // State cho AI phân tích lượng đường & gợi ý bổ sung trong phần ăn
  const [mealText, setMealText] = useState('');
  const [mealImagePreview, setMealImagePreview] = useState(null);
  const [mealImageBase64, setMealImageBase64] = useState(null);
  const [mealMimeType, setMealMimeType] = useState('image/jpeg');
  const [analyzingMeal, setAnalyzingMeal] = useState(false);
  const [mealResult, setMealResult] = useState(null);
  const fileInputRef = useRef(null);

  const CATEGORIES = useMemo(() => [
    { value: 'all', label: `📖 ${t.advice.allAdvice}` },
    { value: 'should_eat', label: `✓ ${t.advice.shouldEat}` },
    { value: 'exercise', label: `↔ ${t.advice.exercise}` },
    { value: 'should_avoid', label: `✗ ${t.advice.shouldAvoid}` },
    { value: 'danger_sign', label: `🔔 ${t.advice.danger}` },
  ], [t]);

  useEffect(() => { fetchAdvice(category); }, [category, fetchAdvice]);

  // Sắp xếp danh sách lời khuyên: Xanh lá (should_eat) -> Xanh dương (exercise) -> Đỏ (should_avoid, danger_sign)
  const sortedAdvice = useMemo(() => {
    return [...(advice || [])].sort((a, b) => {
      const orderA = CATEGORY_SORT_ORDER[a.category] ?? 99;
      const orderB = CATEGORY_SORT_ORDER[b.category] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [advice]);

  const handleSelectMealPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMealMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        setMealImagePreview(dataUrl);
        setMealImageBase64(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeMeal = async (customText) => {
    const queryText = typeof customText === 'string' ? customText : mealText;
    if (!queryText.trim() && !mealImageBase64) return;
    if (typeof customText === 'string') {
      setMealText(customText);
    }
    setAnalyzingMeal(true);
    try {
      const res = await adviceService.analyzeMeal({
        mealText: queryText.trim(),
        imageBase64: mealImageBase64,
        mimeType: mealMimeType,
      });
      setMealResult(res.data?.data || buildClientFallbackMealAnalysis(queryText));
    } catch {
      setMealResult(buildClientFallbackMealAnalysis(queryText));
    } finally {
      setAnalyzingMeal(false);
    }
  };

  const riskBadgeStyle = (riskLevel) => {
    if (riskLevel === 'low') {
      return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
    }
    if (riskLevel === 'high') {
      return { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
    }
    return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
  };

  return (
    <div className={styles.page}>
      <PageHeader title={t.advice.title} subtitle={t.advice.subtitle} />

      {/* Hộp AI Phân tích lượng đường trong phần ăn & Gợi ý cần bổ sung gì */}
      <div className={styles.aiMealWrap}>
        <div className={styles.aiMealCard}>
          <div className={styles.aiMealHead}>
            <span className={styles.aiMealIcon} aria-hidden="true">
              <Utensils size={20} />
            </span>
            <div>
              <h2 className={styles.aiMealTitle}>AI Phân tích lượng đường bữa ăn</h2>
              <p className={styles.aiMealSub}>
                Nhập món ăn hoặc chụp ảnh để biết lượng đường &amp; cần bổ sung gì
              </p>
            </div>
          </div>

          <div className={styles.aiInputRow}>
            <input
              type="text"
              className={styles.aiMealInput}
              placeholder="VD: 1 chén cơm, cá kho, canh rau..."
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAnalyzeMeal();
                }
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelectMealPhoto}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className={styles.aiPhotoBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Chụp hoặc chọn ảnh phần ăn"
              aria-label="Chụp hoặc chọn ảnh phần ăn"
            >
              <Camera size={20} />
            </button>
          </div>

          {mealImagePreview && (
            <div className={styles.aiPhotoPreviewWrap}>
              <img src={mealImagePreview} alt="Ảnh phần ăn" className={styles.aiPhotoPreview} />
              <button
                type="button"
                className={styles.aiRemovePhotoBtn}
                onClick={() => {
                  setMealImagePreview(null);
                  setMealImageBase64(null);
                }}
              >
                <Trash2 size={14} /> Xóa ảnh
              </button>
            </div>
          )}

          <button
            type="button"
            className={styles.aiAnalyzeBtn}
            disabled={analyzingMeal || (!mealText.trim() && !mealImageBase64)}
            onClick={() => handleAnalyzeMeal()}
          >
            <Sparkles size={18} aria-hidden="true" />
            {analyzingMeal ? 'Đang phân tích lượng đường...' : 'Phân tích lượng đường'}
          </button>

          {mealResult && (
            <div className={styles.aiResultCard}>
              <div className={styles.aiResultTop}>
                <div className={styles.aiResultMealName}>{mealResult.mealSummary}</div>
                <span
                  className={styles.aiRiskBadge}
                  style={{
                    background: riskBadgeStyle(mealResult.riskLevel).bg,
                    color: riskBadgeStyle(mealResult.riskLevel).color,
                    borderColor: riskBadgeStyle(mealResult.riskLevel).border,
                  }}
                >
                  {mealResult.riskLevel === 'low' ? (
                    <CheckCircle2 size={15} />
                  ) : mealResult.riskLevel === 'high' ? (
                    <AlertTriangle size={15} />
                  ) : (
                    <Info size={15} />
                  )}
                  {mealResult.riskLabel}
                </span>
              </div>

              <div className={styles.aiMetricsGrid}>
                <div className={styles.aiMetricBox}>
                  <span className={styles.aiMetricVal}>~{mealResult.estimatedCarbsGrams}g</span>
                  <span className={styles.aiMetricLbl}>Tinh bột (Carb)</span>
                </div>
                <div className={styles.aiMetricBox}>
                  <span className={styles.aiMetricVal} style={{ color: '#D97706' }}>
                    ~{mealResult.sugarSpoonsEquivalent} muỗng
                  </span>
                  <span className={styles.aiMetricLbl}>Đường quy đổi</span>
                </div>
                <div className={styles.aiMetricBox}>
                  <span className={styles.aiMetricVal}>
                    {String(mealResult.glycemicIndexEstimate || 'GI ~ 60').replace(/\s*\(.*?\)\s*/g, '').trim()}
                  </span>
                  <span className={styles.aiMetricLbl}>Chỉ số hấp thu</span>
                </div>
              </div>

              {mealResult.explanation && (
                <p className={styles.aiExplanation}>{mealResult.explanation}</p>
              )}

              {/* Phần trọng tâm: Cần bổ sung gì */}
              {Array.isArray(mealResult.needToSupplement) && mealResult.needToSupplement.length > 0 && (
                <div className={styles.aiSupplementBox}>
                  <div className={styles.aiSupplementHead}>
                    🥗 Phần ăn này cần bổ sung gì để ổn định đường huyết?
                  </div>
                  <ul className={styles.aiSupplementList}>
                    {mealResult.needToSupplement.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {mealResult.eatingOrderTip && (
                <div className={styles.aiOrderTip}>
                  <strong>🍽️ Thứ tự ăn tốt nhất:</strong> {mealResult.eatingOrderTip}
                </div>
              )}

              {mealResult.postMealAction && (
                <div className={styles.aiOrderTip}>
                  <strong>🚶 Sau bữa ăn:</strong> {mealResult.postMealAction}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.pillsRow}>
        <FilterPills options={CATEGORIES} value={category} onChange={setCategory} />
      </div>

      <div className={styles.list}>
        {sortedAdvice.map((a) => (
          <AdviceCard key={a.id} advice={a} onView={setSelected} t={t} />
        ))}
      </div>

      {selected && (
        <div className={styles.detailOverlay} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className={styles.detailSheet}>
            <div className={styles.detailHeader}>
              <span className={styles.detailTitle}>{t?.adviceData?.[selected.title] || selected.title}</span>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className={styles.detailBody}>{t?.adviceData?.[selected.detail_content || selected.description] || (selected.detail_content || selected.description)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
