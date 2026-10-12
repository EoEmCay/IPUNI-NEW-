import api from '../services/api';

const STORAGE_KEY = 'diaplus_drug_visuals_v2';

// Kho dữ liệu nhận diện trực quan toàn diện (Ảnh thật hộp/vỉ thuốc tại VN trên CDN + Mô tả bình dân cho các cụ)
const BUILTIN_VISUALS = [
  {
    keywords: ['gliclazid + metformin', 'gliclazide + metformin', 'galvus met', 'janumet', 'xigduo', 'jardiance duo', 'trajenta duo', 'komboglyze', 'glucovance', 'amaryl m'],
    commonName: 'Thuốc hạ đường huyết phối hợp (2 hoạt chất)',
    appearance: 'Viên nén thuôn dài · Uống ngay trong hoặc sau bữa ăn',
    defaultImages: [
      'https://ts2.mm.bing.net/th?id=OIP.0Y1pognDtS7AZxGn2YYVqwHaEg&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['metformin', 'glucophage', 'panfor', 'meglucon', 'diamet', 'siofor', 'gliritd'],
    commonName: 'Thuốc hạ đường huyết (Metformin)',
    appearance: 'Viên nén tròn màu trắng · Lấy trong vỉ bạc',
    defaultImages: [
      'https://ts2.mm.bing.net/th?id=OIP.99kw-hIQAF5givzpmB_axgAAAA&w=480&h=480&c=7',
      'https://cdn.nhathuoclongchau.com.vn/v1/static/IMG_1363_8965617dac.jpg',
    ],
  },
  {
    keywords: ['gliclazide', 'gliclazid', 'diamicron', 'predian', 'glumerif', 'reclide'],
    commonName: 'Thuốc hạ đường huyết trước ăn (Gliclazide)',
    appearance: 'Viên thuôn dài màu trắng · Vỉ nhựa chữ cam/xanh',
    defaultImages: [
      'https://ts2.mm.bing.net/th?id=OIP.nIi-t8Uwq6Ci29-27zcunQHaHG&w=480&h=480&c=7',
      'https://cdn.nhathuoclongchau.com.vn/v1/static/00002400_diamicron_mr_30mg_4804_63ab_large_c2e2eafcb8.jpg',
    ],
  },
  {
    keywords: ['glimepiride', 'glimepirid', 'amaryl', 'glimestad', 'glimpi', 'diaprid'],
    commonName: 'Thuốc hạ đường huyết trước ăn sáng (Glimepiride)',
    appearance: 'Viên nhỏ dẹt màu hồng hoặc xanh nhạt',
    defaultImages: [],
  },
  {
    keywords: ['vildagliptin', 'galvus', 'vigorito', 'vidagyl'],
    commonName: 'Thuốc kiểm soát đường huyết (Vildagliptin)',
    appearance: 'Viên nén tròn dẹt màu trắng đến vàng nhạt · Vỉ nhôm bạc',
    defaultImages: [
      'https://ts1.mm.bing.net/th?id=OIP.4aticS3RAtMiqlGk4WtvYwHaHa&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['sitagliptin', 'januvia', 'sitavia', 'taglita'],
    commonName: 'Thuốc ổn định đường huyết sau ăn (Sitagliptin)',
    appearance: 'Viên nén màu hồng cam / vàng be · Vỉ nhôm',
    defaultImages: [],
  },
  {
    keywords: ['linagliptin', 'trajenta', 'linatab'],
    commonName: 'Thuốc kiểm soát đường huyết an toàn thận (Linagliptin)',
    appearance: 'Viên nén tròn màu đỏ nhạt · Vỉ nhôm bạc',
    defaultImages: [],
  },
  {
    keywords: ['jardiance', 'empagliflozin'],
    commonName: 'Thuốc tiểu đường bảo vệ tim thận (Empagliflozin)',
    appearance: 'Viên nén màu vàng nhạt · Hộp trắng xanh lá',
    defaultImages: [
      'https://ts1.mm.bing.net/th?id=OIP.IWO2x8HjUGohld3D32gKlQHaE8&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['forxiga', 'dapagliflozin'],
    commonName: 'Thuốc tiểu đường thải đường qua thận (Dapagliflozin)',
    appearance: 'Viên nén màu vàng · Vỉ nhôm bạc',
    defaultImages: [],
  },
  {
    keywords: ['acarbose', 'glucobay', 'voglibose', 'basen'],
    commonName: 'Thuốc giảm hấp thu tinh bột sau ăn (Acarbose)',
    appearance: 'Viên nén tròn nhỏ màu trắng (Uống ngay miếng cơm đầu tiên)',
    defaultImages: [],
  },
  {
    keywords: ['nicorandil', 'nikoramyl', 'ikorel', 'pecrandil', 'adancor'],
    commonName: 'Thuốc giãn mạch vành, ngừa đau ngực (Nicorandil)',
    appearance: 'Viên nén tròn nhỏ màu trắng · Vỉ chống ẩm (Bóc ra uống ngay)',
    defaultImages: [
      'https://ts2.mm.bing.net/th?id=OIP.HCteNJwfwm00Fchy4J1S5wHaHa&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['trimetazidine', 'trimetazidin', 'vastarel', 'trizedon', 'metazydyna'],
    commonName: 'Thuốc bảo vệ cơ tim, giảm đau thắt ngực (Trimetazidine)',
    appearance: 'Viên nén tròn/bầu dục màu hồng hoặc đỏ · Vỉ bạc',
    defaultImages: [],
  },
  {
    keywords: ['amlodipine', 'amlodipin', 'amlor', 'norvasc', 'stamlo', 'lercanidipine', 'zanidip', 'nifedipine', 'adalat', 'felodipine', 'plendil'],
    commonName: 'Thuốc ổn định huyết áp (Amlodipine)',
    appearance: 'Viên con nhộng vàng-trắng (hoặc viên nén trắng)',
    defaultImages: [
      'https://ts1.mm.bing.net/th?id=OIP.GW-N2hqdtqFIejIjTTn3gwHaGY&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['bisoprolol', 'concor', 'nebivolol', 'nebilet', 'metoprolol', 'betaloc', 'carvedilol', 'dilatrend', 'atenolol', 'ivabradine', 'procoralan'],
    commonName: 'Thuốc điều hòa nhịp tim & huyết áp (Bisoprolol)',
    appearance: 'Viên nén nhỏ hình trái tim hoặc tròn (màu vàng/hồng nhạt/trắng)',
    defaultImages: [
      'https://ts2.mm.bing.net/th?id=OIP.e2pAfCjuJwHie8FDvF-fnAHaHa&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['candesartan', 'blopress', 'candesar', 'atacand'],
    commonName: 'Thuốc ổn định huyết áp & bảo vệ thận (Candesartan)',
    appearance: 'Viên nén tròn nhỏ màu hồng nhạt hoặc trắng · Vỉ nhôm',
    defaultImages: [
      'https://ts2.mm.bing.net/th?id=OIP.odWtrjgc-DepMe5rraTPUAHaHa&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['losartan', 'cozaar', 'telmisartan', 'micardis', 'telsar', 'valsartan', 'diovan', 'exforge', 'irbesartan', 'approvel', 'coaprovel', 'olmesartan'],
    commonName: 'Thuốc ổn định huyết áp & bảo vệ thận',
    appearance: 'Viên nén màu trắng hoặc vàng/hồng nhạt · Vỉ nhôm',
    defaultImages: [],
  },
  {
    keywords: ['perindopril', 'coversyl', 'coveram', 'preterax', 'viacoram', 'enalapril', 'renitec', 'captopril', 'lisinopril', 'ramipril', 'tritace'],
    commonName: 'Thuốc hạ huyết áp & bảo vệ tim mạch',
    appearance: 'Viên nén thuôn dài hoặc tròn (Thường uống buổi sáng trước ăn)',
    defaultImages: [],
  },
  {
    keywords: ['fenofibrate', 'fenofibrat', 'lipanthyl', 'tricor', 'supralip', 'fenbrat'],
    commonName: 'Thuốc hạ mỡ máu Triglyceride (Fenofibrate)',
    appearance: 'Viên nén hoặc viên nang cứng (Uống ngay trong bữa ăn chính)',
    defaultImages: [
      'https://ts3.mm.bing.net/th?id=OIP.vV04r8KZc02uGYCOV5sRbQHaEa&w=480&h=480&c=7',
    ],
  },
  {
    keywords: ['atorvastatin', 'lipitor', 'atorhasan', 'rosuvastatin', 'crestor', 'simvastatin', 'pitavastatin', 'livalo', 'ezetimibe', 'ezetrol', 'atozet'],
    commonName: 'Thuốc hạ mỡ máu Cholesterol (Uống tối)',
    appearance: 'Viên bầu dục màu trắng/hồng · Vỉ nhôm bạc',
    defaultImages: [],
  },
  {
    keywords: ['aspirin', 'aspilets', 'clopidogrel', 'plavix', 'clopistad', 'ticagrelor', 'brilinta', 'rivaroxaban', 'xarelto', 'dabigatran', 'pradaxa'],
    commonName: 'Thuốc chống cục máu đông, ngừa đột quỵ',
    appearance: 'Viên nén bao phim (Uống sau khi ăn no)',
    defaultImages: [],
  },
  {
    keywords: ['indapamide', 'natrilix', 'fludex', 'furosemide', 'lasix', 'spironolactone', 'verospiron', 'aldactone', 'hydrochlorothiazide'],
    commonName: 'Thuốc lợi tiểu & hạ huyết áp (Uống sáng)',
    appearance: 'Viên nén nhỏ màu trắng/hồng · Uống buổi sáng',
    defaultImages: [],
  },
  {
    keywords: ['gabapentin', 'neurontin', 'pregabalin', 'lyrica', 'thioctacid', 'alpha lipoic', 'mecobalamin', 'methycobal', 'vitamin b', 'neurobion', '3b'],
    commonName: 'Thuốc giảm tê bì chân tay & bổ thần kinh',
    appearance: 'Viên nang hoặc viên nén bao phim theo đơn',
    defaultImages: [],
  },
  {
    keywords: ['omeprazole', 'losec', 'esomeprazole', 'nexium', 'pantoprazole', 'pantoloc', 'rabeprazole', 'pariet', 'lansoprazole'],
    commonName: 'Thuốc bảo vệ dạ dày (Uống trước ăn 30 phút)',
    appearance: 'Viên nang hoặc viên nén kháng dịch vị (Nuốt nguyên viên)',
    defaultImages: [],
  },
  {
    keywords: ['insulin', 'mixtard', 'lantus', 'novomix', 'novorapid', 'humalog', 'levemir', 'tresiba', 'insulatard', 'scilin'],
    commonName: 'Bút tiêm / Lọ tiêm Insulin hạ đường huyết',
    appearance: 'Bút tiêm định liều bảo quản ngăn mát tủ lạnh',
    defaultImages: [],
  },
];

function normalizeKey(drugName) {
  return String(drugName || '')
    .toLowerCase()
    .trim();
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getBuiltinVisual(drugName) {
  const lower = normalizeKey(drugName);
  for (const item of BUILTIN_VISUALS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item;
    }
  }
  return {
    commonName: `Thuốc theo đơn (${drugName || 'Bác sĩ kê'})`,
    appearance: 'Đối chiếu đúng vỏ hộp/vỉ thuốc trên hình',
    defaultImages: [],
  };
}

/**
 * Lấy thông tin hình ảnh & mô tả viên thuốc hiện có (đồng bộ tức thì)
 */
export function getSavedDrugVisual(drugName) {
  const key = normalizeKey(drugName);
  const store = loadStore();
  const saved = store[key] || {};
  const builtin = getBuiltinVisual(drugName);

  const candidates = [
    ...(saved.customImage ? [saved.customImage] : []),
    ...(saved.candidates || []),
    ...(builtin.defaultImages || []),
  ].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);

  // Ưu tiên tên công dụng cụ thể từ builtin nếu saved trước đó chỉ là câu chung chung
  const genericLabel = 'Thuốc điều trị theo đơn bác sĩ';
  const resolvedCommonName =
    saved.commonName && saved.commonName !== genericLabel
      ? saved.commonName
      : builtin.commonName;

  return {
    name: drugName,
    commonName: resolvedCommonName,
    appearance: saved.appearance || builtin.appearance,
    imageUrl: saved.selectedImage || candidates[0] || null,
    candidates,
    isCustomUploaded: Boolean(saved.customImage && saved.selectedImage === saved.customImage),
    isCustomUpload: Boolean(saved.customImage && saved.selectedImage === saved.customImage),
  };
}

/**
 * Nén ảnh vỉ/hộp thuốc người dùng chụp tại nhà sang JPEG base64 gọn nhẹ (~80KB)
 */
export function compressUploadedDrugPhoto(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } catch {
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Lưu ảnh thuốc người dùng chọn (từ kết quả mạng) hoặc ảnh chụp vỉ thuốc thật tải lên
 */
export function saveCustomDrugImage(drugName, imageUrl, { isUpload = false, appearance = null } = {}) {
  const key = normalizeKey(drugName);
  if (!key) return null;
  const store = loadStore();
  const prev = store[key] || {};
  const next = {
    ...prev,
    selectedImage: imageUrl,
    ...(isUpload ? { customImage: imageUrl } : {}),
    ...(appearance !== null ? { appearance } : {}),
    updatedAt: new Date().toISOString(),
  };
  store[key] = next;
  saveStore(store);
  window.dispatchEvent(new CustomEvent('drugVisualUpdated', { detail: { drugName, visual: next } }));
  return getSavedDrugVisual(drugName);
}

/**
 * Tự động tìm kiếm ảnh hộp/vỉ thuốc thật trên mạng cho bất kỳ tên thuốc nào trong đơn
 */
export async function fetchAndCacheDrugVisual(drugName) {
  const key = normalizeKey(drugName);
  if (!key) return getSavedDrugVisual(drugName);

  const current = getSavedDrugVisual(drugName);
  try {
    const res = await api.get('/medications/drug-images', {
      params: { q: drugName },
    });
    const payload = res.data?.data || {};
    const store = loadStore();
    const prev = store[key] || {};

    const mergedCandidates = [
      ...(prev.customImage ? [prev.customImage] : []),
      ...(payload.candidates || []),
      ...(current.candidates || []),
    ].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);

    store[key] = {
      ...prev,
      commonName: payload.commonName || prev.commonName || current.commonName,
      appearance: prev.appearance || payload.appearance || current.appearance,
      candidates: mergedCandidates,
      selectedImage: prev.customImage || mergedCandidates[0] || null,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return getSavedDrugVisual(drugName);
  } catch {
    return current;
  }
}
