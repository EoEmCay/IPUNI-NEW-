const db = require('../../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { jsonrepair } = require('jsonrepair');
const logger = require('../../utils/logger');

const CATEGORY_ORDER = {
  should_eat: 1,   // Xanh lá
  exercise: 2,     // Xanh dương
  should_avoid: 3, // Đỏ
  danger_sign: 4,  // Đỏ cảnh báo
};

async function getAdvice(category) {
  let q = db('advice').where({ is_active: 1 });
  if (category && category !== 'all') q = q.where({ category });
  const rows = await q.orderBy('sort_order');
  return rows.sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category] ?? 99;
    const orderB = CATEGORY_ORDER[b.category] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

async function getAdviceById(id) {
  const item = await db('advice').where({ id }).first();
  if (!item) throw { status: 404, message: 'Lời khuyên không tồn tại' };
  return item;
}

// Cơ sở dữ liệu dinh dưỡng món Việt dự phòng (khi không có mạng hoặc AI bận)
const VIETNAMESE_FOOD_KB = [
  {
    keywords: ['phở', 'pho'],
    name: 'Phở (bò/gà)',
    carbsGrams: 52,
    sugarGrams: 4.5,
    calories: 430,
    giLevel: 'medium',
    impactNote: 'Bánh phở làm từ gạo trắng dễ hấp thu nhanh nếu ăn nhiều bánh.',
    supplements: [
      'Bổ sung thêm 1 đĩa giá trụng và rau thơm (húng quế, ngò gai) ăn trước khi ăn bánh phở',
      'Gọi thêm thịt nạc/ức gà để tăng đạm giúp no lâu, giảm 1/3 lượng bánh phở',
      'Hạn chế húp hết nước béo và không pha thêm tương ngọt',
    ],
  },
  {
    keywords: ['cơm', 'com'],
    name: 'Cơm trắng & món mặn',
    carbsGrams: 46,
    sugarGrams: 3.8,
    calories: 410,
    giLevel: 'medium',
    impactNote: 'Cơm trắng có chỉ số đường huyết (GI ~73) khá cao nếu ăn quá 1 chén đầy.',
    supplements: [
      'Cần bổ sung 1 bát rau luộc hoặc canh rau xanh (rau muống, cải xanh, bông cải, mướp đắng) ăn đầu bữa',
      'Bổ sung đạm tốt: cá hấp/kho nhạt, đậu phụ hoặc ức gà để làm chậm tốc độ hấp thu đường vào máu',
      'Nếu có thể, pha trộn 1/2 gạo lứt hoặc hạt đậu vào cơm',
    ],
  },
  {
    keywords: ['bánh mì', 'banh mi'],
    name: 'Bánh mì Việt Nam',
    carbsGrams: 50,
    sugarGrams: 5.2,
    calories: 390,
    giLevel: 'high',
    impactNote: 'Bánh mì bột mì trắng có chỉ số GI cao (~75), dễ làm tăng đường huyết nhanh sau ăn 1 giờ.',
    supplements: [
      'Cần bổ sung nhiều dưa leo, đồ chua (không ngọt), ngò rí và rau sống kẹp chung',
      'Bổ sung thêm 1 quả trứng ốp la/luộc hoặc thịt nạc, bỏ bớt phần ruột trắng bên trong ổ bánh mì',
      'Uống kèm 1 ly sữa hạt không đường hoặc trà xanh nhạt thay vì sữa đặc/nước ngọt',
    ],
  },
  {
    keywords: ['bún', 'bun', 'miến', 'mien', 'hủ tiếu', 'hu tieu'],
    name: 'Món bún / miến / hủ tiếu',
    carbsGrams: 48,
    sugarGrams: 4.2,
    calories: 420,
    giLevel: 'medium',
    impactNote: 'Tinh bột từ bún/hủ tiếu chuyển hóa thành đường khá nhanh nếu thiếu rau xanh đi kèm.',
    supplements: [
      'Bổ sung thật nhiều rau sống, bắp chuối bào, giá đỗ và rau muống chẻ (chất xơ cản đường hấp thu)',
      'Ăn phần rau và thịt/cá trước, ăn sợi bún sau cùng',
      'Chỉ dùng 1/2 vắt bún so với bình thường và hạn chế húp nước lèo có nêm đường',
    ],
  },
  {
    keywords: ['xôi', 'xoi', 'nếp', 'nep', 'bánh chưng', 'banh chung'],
    name: 'Xôi / Đồ nếp',
    carbsGrams: 62,
    sugarGrams: 6.0,
    calories: 480,
    giLevel: 'high',
    impactNote: 'Gạo nếp có cấu trúc amylopectin phân nhánh làm đường huyết tăng vọt rất nhanh và kéo dài (GI > 85).',
    supplements: [
      'Bắt buộc bổ sung 1 đĩa dưa chuột (dưa leo) hoặc salad rau xanh ăn trước khi ăn xôi',
      'Ăn kèm trứng luộc, thịt nạc hoặc đậu phộng/vừng (mè) không đường để giảm tốc độ hấp thu đường',
      'Chỉ nên ăn 1 nắm nhỏ (khoảng 1/2 gói xôi) và đi bộ 20 phút sau ăn',
    ],
  },
  {
    keywords: ['khoai lang', 'yến mạch', 'yen mach', 'gạo lứt', 'gao lut', 'rau', 'salad', 'cá', 'ức gà'],
    name: 'Khẩu phần GI thấp lành mạnh',
    carbsGrams: 28,
    sugarGrams: 2.1,
    calories: 310,
    giLevel: 'low',
    impactNote: 'Khẩu phần giàu chất xơ và tinh bột hấp thu chậm, rất tốt để giữ đường huyết ổn định.',
    supplements: [
      'Bổ sung thêm chất béo tốt (vài hạt óc chó, hạnh nhân, bơ hoặc dầu ô liu) để tối ưu hấp thu vitamin',
      'Đảm bảo có đủ 1 phần đạm (trứng, cá, đậu hũ) để tránh đói nhanh giữa buổi',
      'Uống đủ 1 ly nước ấm (250ml) trước bữa ăn 15 phút',
    ],
  },
  {
    keywords: ['nước cam', 'nuoc cam', 'trái cây', 'sinh tố', 'chè', 'bánh ngọt', 'trà sữa', 'nước ngọt', 'sữa'],
    name: 'Đồ uống / Trái cây / Món ngọt',
    carbsGrams: 38,
    sugarGrams: 22.0,
    calories: 240,
    giLevel: 'high',
    impactNote: 'Đường lỏng (fructose/sucrose) hấp thu thẳng vào máu chỉ sau 10-15 phút khiến đường huyết tăng đột biến.',
    supplements: [
      'Nên ăn nguyên múi trái cây (cam, bưởi, ổi, táo) thay vì vắt lấy nước để giữ lại màng chất xơ',
      'Bổ sung vài hạt hạnh nhân/óc chó hoặc 1 hộp sữa chua không đường ăn kèm để kìm hãm đà tăng đường',
      'Không uống/ăn đồ ngọt lúc bụng rỗng; chỉ dùng lượng nhỏ ngay sau bữa chính có nhiều rau',
    ],
  },
];

function buildFallbackMealAnalysis(mealText = '') {
  const lower = String(mealText || '').toLowerCase();
  const matched = VIETNAMESE_FOOD_KB.filter((item) =>
    item.keywords.some((kw) => lower.includes(kw))
  );

  if (matched.length === 0) {
    return {
      mealSummary: mealText || 'Khẩu phần ăn trong ảnh / mô tả',
      riskLevel: 'medium',
      riskLabel: 'Trung bình · Cần cân đối rau & đạm',
      estimatedCarbsGrams: 42,
      estimatedSugarGrams: 4.5,
      sugarSpoonsEquivalent: 3.5,
      estimatedCalories: 390,
      glycemicIndexEstimate: 'GI ~ 62 (Trung bình)',
      explanation:
        'Phần ăn có chứa nhóm tinh bột chuyển hóa thành glucose trong máu. Nếu ăn đơn lẻ thiếu chất xơ, đường huyết sau ăn 1–2 giờ có thể tăng nhanh.',
      itemsBreakdown: [
        {
          name: mealText || 'Món chính trong phần ăn',
          carbEstimate: '~42g tinh bột · ~4.5g đường tự nhiên',
          note: 'Nên ăn chậm, nhai kỹ và giảm khoảng 1/4 lượng tinh bột nếu đường huyết sáng nay cao.',
        },
      ],
      needToSupplement: [
        'Bổ sung ngay 1 đĩa rau xanh luộc/hấp (bông cải xanh, cải ngọt, rau muống, khổ qua) ăn TRƯỚC tiên để tạo màng lưới chất xơ cản đường.',
        'Bổ sung thêm đạm nạc (cá, đậu hũ, trứng luộc, thịt nạc) giúp làm chậm quá trình tháo rỗng dạ dày.',
        'Tráng miệng bằng ổi, bưởi hoặc táo (ít ngọt) thay vì nước ép hay bánh ngọt.',
      ],
      eatingOrderTip: 'Quy tắc vàng: Ăn Rau xanh trước ➔ Ăn Thịt/Cá/Đậu ➔ Ăn Cơm/Tinh bột cuối cùng (giúp giảm tới 30% đỉnh đường huyết sau ăn).',
      postMealAction: 'Đi bộ nhẹ nhàng 15–20 phút sau bữa ăn khoảng 30 phút để cơ bắp tiêu thụ bớt đường trong máu.',
    };
  }

  const totalCarbs = matched.reduce((s, m) => s + m.carbsGrams, 0);
  const totalSugar = Number(matched.reduce((s, m) => s + m.sugarGrams, 0).toFixed(1));
  const totalCal = matched.reduce((s, m) => s + m.calories, 0);
  const hasHigh = matched.some((m) => m.giLevel === 'high') || totalCarbs >= 65 || totalSugar >= 15;
  const isLow = !hasHigh && matched.every((m) => m.giLevel === 'low') && totalCarbs <= 35;

  const riskLevel = hasHigh ? 'high' : isLow ? 'low' : 'medium';
  const riskLabel =
    riskLevel === 'high'
      ? 'Lượng đường & tinh bột cao · Cần điều chỉnh'
      : riskLevel === 'low'
      ? 'Lượng đường thấp · An toàn cho đường huyết'
      : 'Lượng đường trung bình · Cần thêm chất xơ';

  const spoons = Number(((totalSugar + totalCarbs * 0.25) / 4).toFixed(1));
  const allSupplements = Array.from(new Set(matched.flatMap((m) => m.supplements))).slice(0, 4);

  return {
    mealSummary: mealText || matched.map((m) => m.name).join(' + '),
    riskLevel,
    riskLabel,
    estimatedCarbsGrams: totalCarbs,
    estimatedSugarGrams: totalSugar,
    sugarSpoonsEquivalent: spoons,
    estimatedCalories: totalCal,
    glycemicIndexEstimate:
      riskLevel === 'high' ? 'GI ~ 75 (Cao)' : riskLevel === 'low' ? 'GI ~ 45 (Thấp)' : 'GI ~ 64 (Trung bình)',
    explanation: matched.map((m) => m.impactNote).join(' '),
    itemsBreakdown: matched.map((m) => ({
      name: m.name,
      carbEstimate: `~${m.carbsGrams}g tinh bột · ~${m.sugarGrams}g đường (${m.calories} kcal)`,
      note: m.impactNote,
    })),
    needToSupplement: allSupplements,
    eatingOrderTip:
      'Quy tắc vàng: Ăn Rau xanh trước ➔ Ăn Thịt/Cá/Đậu ➔ Ăn Cơm/Bún/Tinh bột cuối cùng để đường không tăng vọt.',
    postMealAction:
      riskLevel === 'high'
        ? 'Sau ăn 30 phút nên đi bộ nhẹ 20 phút và uống 1 ly nước lọc ấm. Đo lại đường huyết sau ăn 2 giờ.'
        : 'Duy trì đi bộ nhẹ 15 phút sau bữa ăn để đường huyết ổn định tốt nhất.',
  };
}

async function analyzeMealWithAI({ mealText = '', imageBase64 = null, mimeType = 'image/jpeg' }) {
  const cleanText = String(mealText || '').trim();

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
        },
      });

      const prompt = `Bạn là Bác sĩ Chuyên khoa Dinh dưỡng Đái tháo đường (Tiểu đường) cho người cao tuổi Việt Nam.
Hãy phân tích phần ăn sau đây của bệnh nhân tiểu đường:
Mô tả món ăn: "${cleanText || 'Xem hình ảnh bữa ăn đính kèm'}"

Hãy ước tính lượng đường (sugar), lượng tinh bột chuyển hóa thành đường (carbs), chỉ số đường huyết (GI), đánh giá mức độ an toàn, và ĐẶC BIỆT tư vấn cụ thể BỆNH NHÂN CẦN BỔ SUNG GÌ vào phần ăn này (ví dụ: bổ sung rau gì, đạm gì, chất xơ gì, uống gì, ăn theo thứ tự nào) để kìm hãm tốc độ tăng đường huyết.

Trả về đúng định dạng JSON sau bằng tiếng Việt dễ hiểu, ấm áp cho người lớn tuổi:
{
  "mealSummary": "Tên tóm tắt khẩu phần ăn",
  "riskLevel": "low" | "medium" | "high",
  "riskLabel": "Nhãn ngắn gọn (VD: Lượng đường thấp · An toàn / Lượng đường trung bình / Lượng đường & tinh bột cao)",
  "estimatedCarbsGrams": số_gram_tinh_bột_ước_tính (số nguyên, VD: 45),
  "estimatedSugarGrams": số_gram_đường_trực_tiếp_ước_tính (số thực, VD: 5.5),
  "sugarSpoonsEquivalent": số_muỗng_cà_phê_đường_quy_đổi (1 muỗng ~ 4g đường hấp thu, VD: 3.5),
  "estimatedCalories": số_kcal_ước_tính (VD: 410),
  "glycemicIndexEstimate": "VD: GI ~ 65 (Trung bình)",
  "explanation": "Giải thích ngắn gọn 1-2 câu vì sao phần ăn này ảnh hưởng như vậy tới đường huyết",
  "itemsBreakdown": [
    {
      "name": "Tên món/thành phần",
      "carbEstimate": "VD: ~40g tinh bột · ~3g đường",
      "note": "Nhận xét ngắn về món này với người tiểu đường"
    }
  ],
  "needToSupplement": [
    "Gợi ý 1: Cần bổ sung ngay món gì / rau gì / đạm gì vào bữa ăn này...",
    "Gợi ý 2: Cần bổ sung hoặc thay thế gì để đủ chất mà không tăng đường...",
    "Gợi ý 3: Bổ sung thức uống hoặc trái cây ít đường nào..."
  ],
  "eatingOrderTip": "Hướng dẫn thứ tự ăn các món trong bữa này để giảm đỉnh đường huyết",
  "postMealAction": "Lời khuyên vận động hoặc theo dõi sau bữa ăn"
}`;

      const parts = [prompt];
      if (imageBase64) {
        const cleanB64 = String(imageBase64).replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            data: cleanB64,
            mimeType: mimeType || 'image/jpeg',
          },
        });
      }

      const result = await model.generateContent(parts);
      const rawText = result.response.text();
      if (rawText) {
        const parsed = JSON.parse(jsonrepair(rawText));
        if (parsed && parsed.mealSummary) {
          return parsed;
        }
      }
    } catch (err) {
      logger.warn('[Advice AI Meal] Gemini fallback triggered: ' + err.message);
    }
  }

  return buildFallbackMealAnalysis(cleanText);
}

module.exports = { getAdvice, getAdviceById, analyzeMealWithAI };
