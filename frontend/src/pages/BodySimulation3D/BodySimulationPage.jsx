import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Brain,
  Eye,
  Heart,
  Activity,
  Layers,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import styles from './BodySimulationPage.module.css';

// ========================================================
// CLINICAL DATABASE & COMPLICATION PATHOLOGY ENGINE
// ========================================================

const ORGANS = {
  brain: {
    id: 'brain',
    name: 'Não Bộ & Mạch Máu Não',
    latin: 'Encephalon & Cerebrovascular',
    category: 'Thần kinh & Mạch máu não',
    icon: Brain,
    pos: { x: 210, y: 78 },
    labelPos: { x: 255, y: 72 },
    baseRisk: 32,
    pathology:
      'Dao động đường huyết cấp tính gây phù vi mao mạch não và tổn thương tế bào nội mô. Tích tụ thể ceton và stress oxy hóa làm suy giảm chức năng nhận thức, tăng nguy cơ đột quỵ thiếu máu cục bộ gấp 3 lần.',
    keyStats: [
      { label: 'Tăng nguy cơ Đột quỵ thiếu máu não', value: '+34%' },
      { label: 'Tổn thương hàng rào máu não (BBB)', value: 'Giai đoạn 1' },
      { label: 'Suy giảm trí nhớ & tốc độ xử lý', value: '+26%' },
    ],
    reversalActions: [
      'Giữ chỉ số thời gian trong vùng mục tiêu (TIR > 70%)',
      'Đi bộ nhẹ 15 phút sau ăn giúp hạ đỉnh đường huyết não',
      'Bổ sung Magie và Omega-3 bảo vệ bao myelin thần kinh',
    ],
  },
  eyes: {
    id: 'eyes',
    name: 'Võng Mạc & Đáy Mắt',
    latin: 'Retina & Microvasculature',
    category: 'Biến chứng Vi mạch',
    icon: Eye,
    pos: { x: 210, y: 110 },
    labelPos: { x: 255, y: 110 },
    baseRisk: 28,
    pathology:
      'Đường huyết vượt ngưỡng phá hủy tế bào quanh mạch (Pericytes), làm phình giãn vi mạch đáy mắt và rò rỉ huyết tương (Diabetic Retinopathy). Đây là nguyên nhân hàng đầu gây mờ mắt và mù lòa không hồi phục.',
    keyStats: [
      { label: 'Tổn thương Mao mạch Đáy mắt', value: '+30%' },
      { label: 'Phù hoàng điểm đái tháo đường (DME)', value: 'Cảnh báo sớm' },
      { label: 'Giảm thị lực trong bóng tối', value: '+38%' },
    ],
    reversalActions: [
      'Khám soi đáy mắt định kỳ 6 tháng/lần',
      'Duy trì HbA1c < 7.0% để ngăn rò rỉ vi mạch',
      'Đeo kính râm chống tia UV bảo vệ võng mạc nhạy cảm',
    ],
  },
  heart: {
    id: 'heart',
    name: 'Tim & Hệ Động Mạch Vành',
    latin: 'Cor & Arteria Coronaria',
    category: 'Biến chứng Đại mạch',
    icon: Heart,
    pos: { x: 222, y: 228 },
    labelPos: { x: 265, y: 225 },
    baseRisk: 38,
    pathology:
      'Hyperglycemia kích hoạt viêm nội mạc thành mạch và lắng đọng mảng xơ vữa giàu lipid. Tổn thương thần kinh tự chủ khiến bệnh nhân đái tháo đường dễ bị nhồi máu cơ tim thầm lặng (không hề có cơn đau thắt ngực).',
    keyStats: [
      { label: 'Mảng xơ vữa lòng động mạch vành', value: '+42% tiến triển' },
      { label: 'Nguy cơ biến cố Tim mạch chính (MACE)', value: '+38%' },
      { label: 'Độ cứng thành động mạch chủ', value: 'Tăng 24%' },
    ],
    reversalActions: [
      'Đi bộ 20 phút mỗi ngày kích thích giãn nở mạch vành',
      'Kiểm soát huyết áp < 130/80 mmHg và LDL-C < 1.8 mmol/L',
      'Hạn chế tối đa mỡ chuyển hóa (Trans fat) và chiên rán',
    ],
  },
  kidneys: {
    id: 'kidneys',
    name: 'Thận & Màng Lọc Cầu Thận',
    latin: 'Renes & Glomeruli',
    category: 'Biến chứng Vi mạch & Chuyển hóa',
    icon: Activity,
    pos: { x: 188, y: 312 },
    secondaryPos: { x: 232, y: 315 },
    labelPos: { x: 125, y: 312 },
    baseRisk: 42,
    pathology:
      'Lượng đường đào thải ồ ạt qua nước tiểu gây lợi tiểu thẩm thấu, làm tăng áp lực lọc cầu thận (Hyperfiltration) dẫn đến xơ hóa đài bể thận, rò rỉ đạm niệu (Microalbuminuria) và cuốn trôi Canxi, Magie qua nước tiểu.',
    keyStats: [
      { label: 'Thất thoát Canxi qua thận (Lợi tiểu)', value: '+40%' },
      { label: 'Tổn thương màng lọc cầu thận (eGFR)', value: 'Giảm 18%' },
      { label: 'Microalbumin niệu rò rỉ', value: 'Nguy cơ trung bình' },
    ],
    reversalActions: [
      'Uống đủ 2 - 2.5 lít nước ấm rải đều trong ngày',
      'Hạn chế ăn mặn (< 5g muối/ngày) giảm áp lực cầu thận',
      'Kiểm tra định kỳ tỷ lệ Albumin/Creatinine nước tiểu (uACR)',
    ],
  },
  bones: {
    id: 'bones',
    name: 'Khung Xương & Cổ Xương Đùi',
    latin: 'Systema Skeletale & Collum Femoris',
    category: 'Bệnh lý Xương Đái Tháo Đường',
    icon: Layers,
    pos: { x: 210, y: 382 },
    secondaryPos: { x: 172, y: 438 },
    thirdPos: { x: 248, y: 438 },
    labelPos: { x: 265, y: 380 },
    baseRisk: 45,
    pathology:
      'Các sản phẩm đường hóa bền vững (AGEs) tạo liên kết chéo phá hủy cấu trúc Collagen Type I, biến xương thành cấu trúc giòn xốp như thủy tinh dù mật độ khoáng (BMD) trên máy đo vẫn cao. Nguy cơ gãy cổ xương đùi tăng 2.5 lần.',
    keyStats: [
      { label: 'Độ giòn Collagen xương do AGEs', value: '+35%' },
      { label: 'Nguy cơ gãy nén đốt sống thắt lưng', value: '+42%' },
      { label: 'Tế bào tạo xương (Osteoblasts)', value: 'Ức chế 28%' },
    ],
    reversalActions: [
      'Bổ sung Canxi citrate kết hợp Vitamin D3 + K2 (MK-7)',
      'Tập các bài kháng lực nhẹ (nhón gót, đứng lên ngồi xuống)',
      'Ăn kèm rau xanh giàu chất xơ trước bữa ăn để giảm đường máu đỉnh',
    ],
  },
  feet: {
    id: 'feet',
    name: 'Bàn Chân & Thần Kinh Ngoại Biên',
    latin: 'Pedes & Neuropathia Peripherica',
    category: 'Biến chứng Bàn chân & Thần kinh',
    icon: ShieldAlert,
    pos: { x: 210, y: 690 },
    labelPos: { x: 255, y: 685 },
    baseRisk: 36,
    pathology:
      'Tổn thương bao myelin thần kinh cảm giác khiến người bệnh mất hoàn toàn phản xạ đau nhiệt. Một vết xước nhỏ do giày chật hoặc dị vật có thể nhanh chóng loét sâu, bội nhiễm hoại tử dẫn đến nguy cơ phải đoạn chi (cắt cụt chân).',
    keyStats: [
      { label: 'Mất cảm giác bảo vệ thần kinh', value: '+38%' },
      { label: 'Tắc nghẽn vi tuần hoàn mu bàn chân', value: 'Vùng cảnh báo' },
      { label: 'Thời gian lành vết thương ngoài da', value: 'Chậm hơn 3 lần' },
    ],
    reversalActions: [
      'Soi kiểm tra lòng bàn chân mỗi tối trước khi đi ngủ',
      'Đi giày đế mềm rộng rãi, tuyệt đối không đi chân đất',
      'Giữ ẩm da chân bằng kem chuyên dụng, tránh nứt nẻ gót',
    ],
  },
};

const FOOD_CATALOG = [
  {
    id: 'milk_tea',
    name: 'Trà sữa trân châu đường đen',
    portion: '1 ly 500ml',
    carbs: 68,
    sugar: 54,
    fiber: 0.5,
    gi: 78,
    badge: 'Đường rất cao',
    multiplier: 1.35,
  },
  {
    id: 'com_tam',
    name: 'Cơm tấm sườn bì chả + Nước ngọt',
    portion: '1 dĩa + 1 lon 330ml',
    carbs: 85,
    sugar: 32,
    fiber: 2.0,
    gi: 76,
    badge: 'Tinh bột & đường cao',
    multiplier: 1.4,
  },
  {
    id: 'pho_bo',
    name: 'Phở bò tái nạm tiêu chuẩn',
    portion: '1 tô lớn',
    carbs: 58,
    sugar: 4,
    fiber: 2.5,
    gi: 65,
    badge: 'Tinh bột trung bình',
    multiplier: 1.05,
  },
  {
    id: 'banh_mi',
    name: 'Bánh mì thịt nguội Sài Gòn',
    portion: '1 ổ 220g',
    carbs: 52,
    sugar: 5,
    fiber: 2.2,
    gi: 72,
    badge: 'GI cao',
    multiplier: 1.15,
  },
  {
    id: 'gao_lut',
    name: 'Cơm gạo lứt cá hồi & Bông cải',
    portion: '1 phần 350g',
    carbs: 42,
    sugar: 2,
    fiber: 8.5,
    gi: 48,
    badge: 'Giàu xơ • Tốt',
    multiplier: 0.75,
  },
  {
    id: 'salad_ga',
    name: 'Salad ức gà, bơ & hạt óc chó',
    portion: '1 tô 300g',
    carbs: 14,
    sugar: 2,
    fiber: 7.0,
    gi: 25,
    badge: 'An toàn tối ưu',
    multiplier: 0.55,
  },
];

export default function BodySimulationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // States
  const [gender, setGender] = useState('male');
  const [viewOrientation, setViewOrientation] = useState('front'); // 'front' | 'back'
  const [selectedOrganId, setSelectedOrganId] = useState('bones');
  const [timeHorizon, setTimeHorizon] = useState('current'); // 'current' | '1_year' | '3_years' | '5_years'
  const [scenario, setScenario] = useState('poor'); // 'good' (Kiểm soát tốt) | 'poor' (Lơ là / Ăn ngọt)
  const [checkedActions, setCheckedActions] = useState({});

  // Food Scanner / Meal Selector State
  const initialMeal = FOOD_CATALOG.find((f) => f.id === searchParams.get('meal')) || FOOD_CATALOG[0];
  const [activeMeal, setActiveMeal] = useState(initialMeal);
  const [scannerOpen, setScannerOpen] = useState(searchParams.get('scanner') === '1');
  const [preMealGlucose, setPreMealGlucose] = useState('5.8');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);

  // Calculate Glucotoxicity & Biological Age Multiplier
  const { organRiskMap, biologicalAge, peakGlucose, overallRiskScore } = useMemo(() => {
    const pre = parseFloat(preMealGlucose) || 5.8;
    const foodMultiplier = activeMeal.multiplier;
    const peak = +(pre + foodMultiplier * 4.8).toFixed(1);

    // Time horizon factor
    let timeFactor = 1.0;
    if (timeHorizon === '1_year') timeFactor = 1.25;
    else if (timeHorizon === '3_years') timeFactor = 1.6;
    else if (timeHorizon === '5_years') timeFactor = 2.05;

    // Scenario factor
    const scenarioMult = scenario === 'good' ? 0.48 : 1.0;

    // Calculate risk score for each organ
    const risks = {};
    let sumRisk = 0;
    Object.keys(ORGANS).forEach((k) => {
      const organ = ORGANS[k];
      let r = organ.baseRisk * (foodMultiplier * 0.75 + 0.25) * (scenario === 'good' ? 0.65 : 1.0);
      if (timeHorizon !== 'current') {
        if (scenario === 'poor') {
          r = r * (1 + (timeFactor - 1) * 0.85);
        } else {
          r = Math.max(8, r * (1 - (timeFactor - 1) * 0.4));
        }
      }
      // Reversal checked actions relief
      const completedCount = Object.keys(checkedActions).filter(
        (actionKey) => actionKey.startsWith(`${k}-`) && checkedActions[actionKey]
      ).length;
      r = Math.max(6, r - completedCount * 9);

      const finalVal = Math.min(94, Math.round(r));
      risks[k] = finalVal;
      sumRisk += finalVal;
    });

    const avgRisk = Math.round(sumRisk / Object.keys(ORGANS).length);

    // Biological age calculation (Baseline: 52)
    let bioAgeDelta = 0;
    if (scenario === 'poor') {
      if (timeHorizon === 'current') bioAgeDelta = +(avgRisk > 40 ? 3.5 : 1.5);
      else if (timeHorizon === '1_year') bioAgeDelta = +4.5;
      else if (timeHorizon === '3_years') bioAgeDelta = +6.8;
      else bioAgeDelta = +9.5;
    } else {
      if (timeHorizon === 'current') bioAgeDelta = -0.5;
      else if (timeHorizon === '1_year') bioAgeDelta = -1.8;
      else if (timeHorizon === '3_years') bioAgeDelta = -3.2;
      else bioAgeDelta = -4.5;
    }

    return {
      organRiskMap: risks,
      biologicalAge: +(52 + bioAgeDelta).toFixed(1),
      peakGlucose: peak,
      overallRiskScore: avgRisk,
    };
  }, [preMealGlucose, activeMeal, timeHorizon, scenario, checkedActions]);

  const selectedOrgan = ORGANS[selectedOrganId] || ORGANS.bones;
  const currentOrganRisk = organRiskMap[selectedOrganId] || 45;

  // Toggle Reversal Action Checkbox
  const toggleAction = useCallback((actionIdx) => {
    const key = `${selectedOrganId}-${actionIdx}`;
    setCheckedActions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, [selectedOrganId]);

  // Photo upload handler
  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedPhoto(URL.createObjectURL(file));
    const fname = (file.name || '').toLowerCase();
    if (fname.includes('pho') || fname.includes('bun')) setActiveMeal(FOOD_CATALOG[2]);
    else if (fname.includes('com')) setActiveMeal(FOOD_CATALOG[1]);
    else if (fname.includes('banh')) setActiveMeal(FOOD_CATALOG[3]);
    else if (fname.includes('salad') || fname.includes('rau')) setActiveMeal(FOOD_CATALOG[5]);
    else setActiveMeal(FOOD_CATALOG[0]);
  }, []);

  // Helper color getter based on risk
  const getRiskColor = (risk) => {
    if (risk >= 50) return '#ef4444';
    if (risk >= 30) return '#f59e0b';
    return '#10b981';
  };

  const getRiskLabel = (risk) => {
    if (risk >= 50) return 'Nguy cơ cao';
    if (risk >= 30) return 'Cần lưu ý';
    return 'An toàn';
  };

  return (
    <div className={styles.page}>
      {/* Visual background accents */}
      <div className={styles.gridOverlay} />
      <div className={styles.ambientGlowTop} />

      {/* ── 1. TOP HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={styles.backBtn}
            title="Quay lại Trang chủ"
          >
            <ArrowLeft size={16} />
            <span>Trang chủ DIA+</span>
          </button>
          <div className={styles.appBrand}>
            <span className={styles.brandTitle}>DIA+ DIGITAL TWIN</span>
            <span className={styles.brandSub}>Bản Đồ Sinh Học & Biến Chứng Đái Tháo Đường</span>
          </div>
        </div>

        <div className={styles.headerControls}>
          {/* Gender Selector */}
          <div className={styles.pillGroup}>
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`${styles.pillBtn} ${gender === 'male' ? styles.pillBtnActive : ''}`}
            >
              Nam ♂
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`${styles.pillBtn} ${gender === 'female' ? styles.pillBtnActive : ''}`}
            >
              Nữ ♀
            </button>
          </div>

          {/* Front / Back Orientation */}
          <div className={styles.pillGroup}>
            <button
              type="button"
              onClick={() => setViewOrientation('front')}
              className={`${styles.pillBtn} ${viewOrientation === 'front' ? styles.pillBtnActive : ''}`}
            >
              Mặt trước
            </button>
            <button
              type="button"
              onClick={() => setViewOrientation('back')}
              className={`${styles.pillBtn} ${viewOrientation === 'back' ? styles.pillBtnActive : ''}`}
            >
              Mặt sau
            </button>
          </div>

          {/* Food Scanner Trigger */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className={styles.scannerTriggerBtn}
          >
            <Camera size={15} />
            <span>Chụp / Thử Nghiệm Món Ăn</span>
          </button>
        </div>
      </header>

      {/* ── 2. TIME-TRAVEL SIMULATION DOCK ── */}
      <div className={styles.timeControlBar}>
        <div className={styles.mealQuickInfo}>
          <span className={styles.mealTag}>Món đang mô phỏng</span>
          <span className={styles.mealNameText}>
            {activeMeal.name} • Đỉnh đường huyết: <strong>{peakGlucose} mmol/L</strong>
          </span>
        </div>

        {/* Future Time-Travel Slider (Hiện tại -> 1 năm -> 3 năm -> 5 năm) */}
        <div className={styles.timeSliderSection}>
          <span className={styles.timeSliderLabel}>
            <Clock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Dự báo tương lai:
          </span>
          <div className={styles.timelineButtons}>
            <button
              type="button"
              onClick={() => setTimeHorizon('current')}
              className={`${styles.timelineBtn} ${timeHorizon === 'current' ? styles.timelineBtnActive : ''}`}
            >
              Hiện tại
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('1_year')}
              className={`${styles.timelineBtn} ${timeHorizon === '1_year' ? styles.timelineBtnActive : ''}`}
            >
              1 Năm sau
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('3_years')}
              className={`${styles.timelineBtn} ${timeHorizon === '3_years' ? styles.timelineBtnActive : ''}`}
            >
              3 Năm sau
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('5_years')}
              className={`${styles.timelineBtn} ${timeHorizon === '5_years' ? styles.timelineBtnActive : ''}`}
            >
              5 Năm sau
            </button>
          </div>

          {/* Scenario Toggle */}
          <button
            type="button"
            onClick={() => setScenario((s) => (s === 'good' ? 'poor' : 'good'))}
            className={styles.scenarioToggle}
            title="Chuyển đổi kịch bản lối sống"
          >
            <span
              className={`${styles.scenarioToggleText} ${
                scenario === 'good' ? styles.scenarioGood : styles.scenarioPoor
              }`}
            >
              {scenario === 'good' ? '🟢 Kịch bản: Kiểm soát tốt & Vận động' : '🔴 Kịch bản: Lơ là & Đường huyết cao'}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE ── */}
      <div className={styles.workspace}>
        {/* ── 3A. CENTER BODY VIEWPORT (SVG SILHOUETTE + RADAR HEATMAP) ── */}
        <div className={styles.bodyViewport}>
          {/* Biological Vascular Age Badge */}
          <div className={styles.bioAgeBadge}>
            <span className={styles.bioAgeLabel}>Tuổi sinh học mạch máu</span>
            <span className={styles.bioAgeVal}>{biologicalAge} <small style={{ fontSize: 12, fontWeight: 500 }}>tuổi</small></span>
            <span
              className={styles.bioAgeDelta}
              style={{ color: biologicalAge > 52 ? '#f87171' : '#34d399' }}
            >
              {biologicalAge > 52 ? (
                <>
                  <TrendingUp size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  Già hơn tuổi thật {(biologicalAge - 52).toFixed(1)} tuổi
                </>
              ) : (
                <>
                  <TrendingDown size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  Trẻ hơn tuổi thật {(52 - biologicalAge).toFixed(1)} tuổi
                </>
              )}
            </span>
          </div>

          {/* Interactive SVG Anatomical Glass Silhouette */}
          <div className={styles.svgBodyContainer}>
            <svg
              viewBox="0 0 440 760"
              className={styles.bodySvg}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Radial Glow Filters */}
                <filter id="organGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="16" result="blur" />
                </filter>
                <linearGradient id="bodyGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#0f2452" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#030816" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* 1. Underlying Organ Heatmap Glow Radiations */}
              {Object.keys(ORGANS).map((key) => {
                const organ = ORGANS[key];
                const risk = organRiskMap[key] || 30;
                const col = getRiskColor(risk);
                return (
                  <g key={`glow-${key}`}>
                    <circle
                      cx={organ.pos.x}
                      cy={organ.pos.y}
                      r={risk > 45 ? 54 : 38}
                      fill={col}
                      opacity={risk > 45 ? 0.38 : 0.22}
                      filter="url(#organGlow)"
                    />
                    {organ.secondaryPos && (
                      <circle
                        cx={organ.secondaryPos.x}
                        cy={organ.secondaryPos.y}
                        r={risk > 45 ? 46 : 32}
                        fill={col}
                        opacity={risk > 45 ? 0.32 : 0.18}
                        filter="url(#organGlow)"
                      />
                    )}
                    {organ.thirdPos && (
                      <circle
                        cx={organ.thirdPos.x}
                        cy={organ.thirdPos.y}
                        r={risk > 45 ? 46 : 32}
                        fill={col}
                        opacity={risk > 45 ? 0.32 : 0.18}
                        filter="url(#organGlow)"
                      />
                    )}
                  </g>
                );
              })}

              {/* 2. Sculpted Anatomical Human Body Glass Silhouette (Symmetric Half-Mirrored) */}
              <defs>
                <path
                  id="halfBodyMale"
                  d="
                    M 220 44
                    C 198 44 184 60 184 86
                    C 184 108 198 124 212 134
                    L 220 136
                    M 206 132
                    C 200 144 188 154 172 162
                    C 152 168 135 180 128 205
                    C 122 230 118 265 114 310
                    C 110 345 104 395 100 430
                    C 97 445 102 455 108 458
                    C 114 455 118 445 120 430
                    C 124 395 130 345 134 300
                    L 142 240
                    C 150 260 158 295 162 340
                    C 164 375 156 410 150 445
                    C 144 485 146 535 152 580
                    C 150 615 146 660 148 705
                    C 144 720 136 728 130 732
                    L 165 732
                    C 168 720 166 708 164 702
                    C 168 660 172 615 172 580
                    C 174 535 190 485 220 445
                    Z
                  "
                  fill="url(#bodyGlassGrad)"
                  stroke="rgba(147, 197, 253, 0.45)"
                  strokeWidth="1.5"
                />
                <path
                  id="halfBodyFemale"
                  d="
                    M 220 44
                    C 198 44 186 60 186 86
                    C 186 108 198 124 212 134
                    L 220 136
                    M 206 132
                    C 200 144 190 154 176 162
                    C 156 168 142 180 136 205
                    C 130 230 126 265 122 310
                    C 118 345 112 395 108 430
                    C 105 445 110 455 116 458
                    C 122 455 126 445 128 430
                    C 132 395 138 345 142 300
                    L 148 240
                    C 154 260 162 295 168 340
                    C 170 375 150 410 144 445
                    C 138 485 142 535 148 580
                    C 146 615 142 660 144 705
                    C 140 720 134 728 128 732
                    L 162 732
                    C 165 720 163 708 161 702
                    C 165 660 169 615 169 580
                    C 171 535 188 485 220 445
                    Z
                  "
                  fill="url(#bodyGlassGrad)"
                  stroke="rgba(147, 197, 253, 0.45)"
                  strokeWidth="1.5"
                />
              </defs>

              <g id="bodySilhouetteFull">
                {gender === 'male' ? (
                  <>
                    <use href="#halfBodyMale" />
                    <use href="#halfBodyMale" transform="translate(440, 0) scale(-1, 1)" />
                  </>
                ) : (
                  <>
                    <use href="#halfBodyFemale" />
                    <use href="#halfBodyFemale" transform="translate(440, 0) scale(-1, 1)" />
                  </>
                )}
              </g>

              {/* 3. High-Tech Internal Anatomical Structure (Spine, Ribs, Pelvis, Organs) */}
              <g id="wireframeSkeleton" stroke="rgba(56, 189, 248, 0.32)" strokeWidth="1">
                {/* Central Spine Column */}
                <line x1="220" y1="138" x2="220" y2="445" stroke="url(#spineGrad)" strokeWidth="2.5" strokeDasharray="4 3" />

                {/* Delicate Cranium & Brain Silhouette */}
                <ellipse cx="220" cy="84" rx="26" ry="34" stroke="rgba(147, 197, 253, 0.35)" />
                <path d="M 213 72 C 206 72 202 84 212 92 C 217 92 218 72 213 72 Z" fill="rgba(56, 189, 248, 0.12)" />
                <path d="M 227 72 C 234 72 238 84 228 92 C 223 92 222 72 227 72 Z" fill="rgba(56, 189, 248, 0.12)" />

                {/* Eyes / Retina */}
                <circle cx="211" cy="98" r="3" fill="#38bdf8" opacity="0.8" />
                <circle cx="229" cy="98" r="3" fill="#38bdf8" opacity="0.8" />

                {/* Clavicles */}
                <path d="M 180 162 Q 220 172 260 162" fill="none" strokeWidth="1.2" />

                {/* Rib Arcs */}
                <path d="M 185 190 Q 220 205 255 190" fill="none" />
                <path d="M 175 215 Q 220 232 265 215" fill="none" />
                <path d="M 170 240 Q 220 260 270 240" fill="none" />
                <path d="M 172 265 Q 220 285 268 265" fill="none" />
                <path d="M 178 290 Q 220 308 262 290" fill="none" />

                {/* Cardiac Silhouette & Aortic Arch */}
                <path
                  d="M 224 215 C 235 215 244 225 242 238 C 240 252 225 262 222 264 C 219 262 208 252 210 238 C 212 225 218 215 224 215 Z"
                  fill="rgba(244, 63, 94, 0.16)"
                  stroke="rgba(244, 63, 94, 0.45)"
                  strokeWidth="1.2"
                />

                {/* Kidneys (Bilateral) */}
                <ellipse cx="190" cy="312" rx="10" ry="16" fill="rgba(234, 88, 12, 0.14)" stroke="rgba(234, 88, 12, 0.45)" />
                <ellipse cx="250" cy="315" rx="10" ry="16" fill="rgba(234, 88, 12, 0.14)" stroke="rgba(234, 88, 12, 0.45)" />

                {/* Pelvic Basin & Femoral Bones */}
                <path d="M 168 415 Q 220 445 272 415" fill="none" strokeWidth="1.5" stroke="rgba(147, 197, 253, 0.4)" />
                <line x1="178" y1="438" x2="168" y2="580" strokeWidth="1.5" strokeDasharray="5 3" />
                <line x1="262" y1="438" x2="272" y2="580" strokeWidth="1.5" strokeDasharray="5 3" />
              </g>

              {/* 4. Interactive Organ Nodes & Pulsating Radar Rings */}
              {Object.keys(ORGANS).map((key) => {
                const organ = ORGANS[key];
                const isSelected = selectedOrganId === key;
                const risk = organRiskMap[key] || 35;
                const col = getRiskColor(risk);

                return (
                  <g
                    key={`node-${key}`}
                    className={styles.radarNode}
                    onClick={() => setSelectedOrganId(key)}
                  >
                    {/* Pulsing ring animation */}
                    <circle
                      cx={organ.pos.x}
                      cy={organ.pos.y}
                      r="16"
                      stroke={col}
                      strokeWidth="2"
                      fill="none"
                      className={styles.pulseRing}
                    />

                    {/* Outer target ring */}
                    <circle
                      cx={organ.pos.x}
                      cy={organ.pos.y}
                      r={isSelected ? 14 : 10}
                      stroke={isSelected ? '#ffffff' : col}
                      strokeWidth={isSelected ? 2.5 : 1.8}
                      fill="rgba(8, 20, 50, 0.85)"
                    />

                    {/* Center glowing core dot */}
                    <circle
                      cx={organ.pos.x}
                      cy={organ.pos.y}
                      r={isSelected ? 6 : 4.5}
                      fill={col}
                    />

                    {/* Secondary bone hotspots for Lumbar Spine & Femoral Necks */}
                    {organ.secondaryPos && (
                      <circle
                        cx={organ.secondaryPos.x}
                        cy={organ.secondaryPos.y}
                        r="8"
                        stroke={col}
                        strokeWidth="1.5"
                        fill="rgba(8, 20, 50, 0.7)"
                      />
                    )}
                    {organ.thirdPos && (
                      <circle
                        cx={organ.thirdPos.x}
                        cy={organ.thirdPos.y}
                        r="8"
                        stroke={col}
                        strokeWidth="1.5"
                        fill="rgba(8, 20, 50, 0.7)"
                      />
                    )}

                    {/* Leader Line to callout text if selected */}
                    {isSelected && (
                      <line
                        x1={organ.pos.x}
                        y1={organ.pos.y}
                        x2={organ.labelPos.x - 6}
                        y2={organ.labelPos.y}
                        stroke={col}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    )}

                    {/* Callout Label Tag */}
                    <text
                      x={organ.labelPos.x}
                      y={organ.labelPos.y + 4}
                      fill={isSelected ? '#ffffff' : col}
                      className={styles.nodeCallout}
                    >
                      {organ.name.split('&')[0].trim()} ({risk}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ── 3B. RIGHT CLINICAL DIAGNOSTIC CARD (SELECTED ORGAN DEEP DIVE) ── */}
        <aside className={styles.diagnosticPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.organTitleBlock}>
              <span className={styles.organCategory}>{selectedOrgan.category}</span>
              <h3 className={styles.organName}>{selectedOrgan.name}</h3>
              <span className={styles.organLatin}>{selectedOrgan.latin}</span>
            </div>
            <span
              className={`${styles.riskBadgeLarge} ${
                currentOrganRisk >= 50
                  ? styles.riskHigh
                  : currentOrganRisk >= 30
                    ? styles.riskModerate
                    : styles.riskLow
              }`}
            >
              {getRiskLabel(currentOrganRisk)}
            </span>
          </div>

          {/* Risk Gauge Bar */}
          <div className={styles.riskMeterBlock}>
            <div className={styles.riskMeterTop}>
              <span className={styles.riskMeterLabel}>Chỉ số Nguy cơ Tổn thương</span>
              <span className={styles.riskMeterValue} style={{ color: getRiskColor(currentOrganRisk) }}>
                {currentOrganRisk}%
              </span>
            </div>
            <div className={styles.meterTrack}>
              <div
                className={styles.meterFill}
                style={{
                  width: `${currentOrganRisk}%`,
                  background:
                    currentOrganRisk >= 50
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : currentOrganRisk >= 30
                        ? 'linear-gradient(90deg, #38bdf8, #f59e0b)'
                        : 'linear-gradient(90deg, #10b981, #38bdf8)',
                }}
              />
            </div>
          </div>

          {/* Pathology Mechanism Breakdown */}
          <div className={styles.mechanismCard}>
            <div className={styles.mechanismTitle}>Cơ chế Sinh học & Phá hủy Mô:</div>
            <p style={{ margin: 0 }}>{selectedOrgan.pathology}</p>
          </div>

          {/* Detailed Clinical Metrics */}
          <div className={styles.metricRowList}>
            {selectedOrgan.keyStats.map((stat, idx) => (
              <div key={idx} className={styles.metricRow}>
                <span>{stat.label}:</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          {/* Reversal Action Plan (Interactive Checklist) */}
          <div className={styles.reversalSection}>
            <div className={styles.reversalTitle}>
              <span>
                <Sparkles size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                Hành động Khẩn cấp • Giảm tải rủi ro:
              </span>
              <span style={{ fontSize: 10, color: '#93c5fd' }}>Tích chọn để làm dịu</span>
            </div>

            <div className={styles.actionItemList}>
              {selectedOrgan.reversalActions.map((action, idx) => {
                const isChecked = Boolean(checkedActions[`${selectedOrgan.id}-${idx}`]);
                return (
                  <div
                    key={idx}
                    className={styles.actionItem}
                    onClick={() => toggleAction(idx)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className={`${styles.checkboxSquare} ${
                        isChecked ? styles.checkboxChecked : ''
                      }`}
                    >
                      {isChecked && <CheckCircle2 size={13} color="#ffffff" />}
                    </div>
                    <span style={{ textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.75 : 1 }}>
                      {action}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* ── 4. BOTTOM ORGAN QUICK SELECTOR TABS ── */}
      <nav className={styles.organTabBar} aria-label="Danh sách cơ quan đích">
        {Object.keys(ORGANS).map((key) => {
          const item = ORGANS[key];
          const isAct = selectedOrganId === key;
          const risk = organRiskMap[key] || 30;
          const IconComp = item.icon;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedOrganId(key)}
              className={`${styles.organTabBtn} ${isAct ? styles.organTabBtnActive : ''}`}
            >
              <IconComp size={14} color={isAct ? '#ffffff' : getRiskColor(risk)} />
              <span>{item.name.split('&')[0].trim()}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 999,
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: isAct ? '#ffffff' : getRiskColor(risk),
                }}
              >
                {risk}%
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── 5. FOOD SCANNER & SIMULATION MODAL ── */}
      {scannerOpen && (
        <div className={styles.scannerOverlay} onClick={() => setScannerOpen(false)}>
          <div className={styles.scannerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.scannerHeader}>
              <div>
                <h3 className={styles.scannerTitle}>Thử Nghiệm Món Ăn & Đánh Giá Độc Tính Đường</h3>
                <p className={styles.scannerSub}>
                  Chọn hoặc chụp ảnh món ăn để mô phỏng ngay tác động sinh hóa lên Mắt, Tim, Thận, Khung xương và Bàn chân trên Bản đồ nhiệt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className={styles.closeModalBtn}
              >
                <X size={16} />
              </button>
            </div>

            {/* Photo Upload Zone */}
            <div
              className={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Camera size={22} color="#60a5fa" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                    {uploadedPhoto ? 'Đã tải ảnh món ăn lên' : 'Chụp ảnh hoặc Tải ảnh món ăn / đồ uống'}
                  </div>
                  <div style={{ fontSize: 11, color: '#93c5fd' }}>
                    Tự động nhận diện thành phần bột đường và chỉ số đường huyết (GI)
                  </div>
                </div>
              </div>
              {uploadedPhoto && (
                <img src={uploadedPhoto} alt="Món đã chụp" className={styles.uploadPreviewImg} />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Quick Dish Selection Grid */}
            <div className={styles.foodGridLabel}>Hoặc chọn nhanh món ăn phổ biến:</div>
            <div className={styles.foodGrid}>
              {FOOD_CATALOG.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMeal(item)}
                  className={`${styles.foodItemBtn} ${
                    activeMeal.id === item.id ? styles.foodItemBtnActive : ''
                  }`}
                >
                  <div className={styles.foodItemTop}>
                    <span>{item.name}</span>
                  </div>
                  <div className={styles.foodItemMeta}>
                    {item.portion} • {item.carbs}g Carb • {item.badge}
                  </div>
                </button>
              ))}
            </div>

            {/* Pre-meal Glucose Input */}
            <div className={styles.inputRow}>
              <div className={styles.inputFieldGroup}>
                <label className={styles.inputLabel}>Đường huyết trước ăn (mmol/L):</label>
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="25.0"
                  value={preMealGlucose}
                  onChange={(e) => setPreMealGlucose(e.target.value)}
                  className={styles.numberInput}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScannerOpen(false)}
              className={styles.startSimBtn}
            >
              Cập Nhật Bản Đồ Nhiệt Cơ Thể Ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
