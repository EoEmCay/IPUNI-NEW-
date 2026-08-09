const axios = require('axios');

const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

// Cache để tránh request lặp
const drugCache = new Map();

async function searchDrug(drugName) {
  try {
    if (drugCache.has(drugName.toLowerCase())) {
      return drugCache.get(drugName.toLowerCase());
    }

    const response = await axios.get(`${RXNORM_BASE_URL}/drugs.json`, {
      params: { name: drugName },
      timeout: 5000
    });

    const drugs = response.data?.drugGroup?.conceptGroup?.[0]?.conceptProperties || [];
    return drugs.length > 0 ? drugs[0] : null;
  } catch (error) {
    console.error('RxNorm search error:', error.message);
    return null;
  }
}

async function getDrugInfo(rxcui) {
  try {
    const [propsRes, interactRes, relatedRes] = await Promise.all([
      axios.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/properties.json`, { timeout: 5000 }),
      axios.get(`${RXNORM_BASE_URL}/interaction/interaction.json?rxcui=${rxcui}`, { timeout: 5000 }),
      axios.get(`${RXNORM_BASE_URL}/rxcui/${rxcui}/related.json`, { timeout: 5000 })
    ]).catch(err => {
      console.error('RxNorm API error:', err.message);
      return [null, null, null];
    });

    const properties = propsRes?.data?.properties || {};
    const interactions = interactRes?.data?.interactionTypeGroup || [];
    const related = relatedRes?.data?.relatedGroup || [];

    return {
      rxcui,
      name: properties.name || '',
      strength: properties.strength || '',
      rxnormName: properties.synonym || [],
      interactions: formatInteractions(interactions),
      relatedDrugs: formatRelatedDrugs(related)
    };
  } catch (error) {
    console.error('getDrugInfo error:', error.message);
    return null;
  }
}

function formatInteractions(interactionGroup) {
  const interactions = [];
  if (!Array.isArray(interactionGroup)) return interactions;

  interactionGroup.forEach(group => {
    group.interactionPair?.forEach(pair => {
      pair.interactionConcept?.forEach(concept => {
        interactions.push({
          description: concept.lowInteractionConcept?.name || concept.highInteractionConcept?.name || '',
          severity: pair.severity || 'Unknown'
        });
      });
    });
  });

  return interactions;
}

function formatRelatedDrugs(relatedGroup) {
  const related = [];
  if (!Array.isArray(relatedGroup)) return related;

  relatedGroup.forEach(group => {
    group.conceptProperties?.forEach(drug => {
      related.push({
        name: drug.name,
        rxcui: drug.rxcui
      });
    });
  });

  return related;
}

async function fetchFullDrugDetails(drugName) {
  try {
    const drug = await searchDrug(drugName);
    if (!drug) return null;

    const fullInfo = await getDrugInfo(drug.rxcui);
    return {
      ...drug,
      ...fullInfo,
      source: 'RxNorm (NIH - National Library of Medicine)'
    };
  } catch (error) {
    console.error('fetchFullDrugDetails error:', error.message);
    return null;
  }
}

// Fetch diabetes-specific information từ external sources
async function getDiabetesDrugInfo(drugName) {
  try {
    // Đây là nơi để add thông tin từ Mayo Clinic, ADA
    // Hiện tại fetch từ RxNorm, sau có thể expand
    const rxnormData = await fetchFullDrugDetails(drugName);

    if (!rxnormData) {
      return {
        name: drugName,
        error: 'Không tìm thấy thông tin từ RxNorm',
        source: 'RxNorm'
      };
    }

    return {
      name: rxnormData.name || drugName,
      strength: rxnormData.strength || 'N/A',
      purpose: getDrugPurpose(drugName),
      mechanism: getDrugMechanism(drugName),
      sideEffects: getDrugSideEffects(drugName),
      contraindications: getDrugContraindications(drugName),
      interactions: rxnormData.interactions || [],
      rxnormLink: `https://www.nlm.nih.gov/medlineplus/druginfo/meds/${rxnormData.rxcui}.html`,
      source: 'RxNorm (NIH) + Mayo Clinic + ADA'
    };
  } catch (error) {
    console.error('getDiabetesDrugInfo error:', error.message);
    return null;
  }
}

// Thông tin chi tiết về thuốc tiểu đường (hard-coded từ Mayo Clinic + ADA sources)
function getDrugPurpose(drugName) {
  const purposes = {
    'metformin': 'Giảm lượng đường được gan sản xuất, tăng độ nhạy insulin',
    'gliclazide': 'Kích thích tuyến tụy tiết insulin nhiều hơn',
    'glimepiride': 'Kích thích tuyến tụy tiết insulin nhanh chóng',
    'sitagliptin': 'Ức chế enzyme DPP-4, giúp cơ thể tiết insulin khi cần',
    'insulin': 'Bổ sung insulin cho cơ thể, kiểm soát đường huyết',
    'empagliflozin': 'Giảm tái hấp thu glucose ở thận, bài xuất qua nước tiểu',
    'dapagliflozin': 'Bài xuất glucose qua nước tiểu, giảm đường huyết',
    'acarbose': 'Chậm hấp thu glucose ở ruột non, giảm đường huyết sau ăn',
    'pioglitazone': 'Tăng độ nhạy cảm insulin, giúp cơ thể sử dụng insulin tốt hơn',
    'liraglutide': 'Tăng tiết insulin phụ thuộc glucose, giảm cảm giác đói',
    'semaglutide': 'Tiêm hàng tuần, giảm đường huyết và giảm cân'
  };

  return purposes[drugName.toLowerCase()] || 'Thuốc điều trị tiểu đường type 2';
}

function getDrugMechanism(drugName) {
  const mechanisms = {
    'metformin': 'Giảm sản xuất glucose ở gan, tăng nhạy cảm insulin, cải thiện hấp thu glucose ở cơ bắp',
    'gliclazide': 'Hoạt động trên tế bào beta tuyến tụy, tăng tiết insulin',
    'glimepiride': 'Kích hoạt kênh K-ATP trên tế bào beta, tăng tiết insulin',
    'sitagliptin': 'Tăng GLP-1, kích thích tiết insulin phụ thuộc glucose',
    'insulin': 'Thay thế insulin tự nhiên, cho phép glucose vào tế bào cơ bắp',
    'empagliflozin': 'Ức chế SGLT2 transporter, glucose bị loại qua nước tiểu',
    'dapagliflozin': 'Ức chế kênh SGLT2, giảm tái hấp thu glucose ở thận',
    'acarbose': 'Ức chế enzyme tiêu hóa carbs, giảm tốc độ hấp thu glucose',
    'pioglitazone': 'Hoạt động trên PPAR-gamma, tăng nhạy cảm insulin',
    'liraglutide': 'Tăng GLP-1 receptor signaling',
    'semaglutide': 'Hoạt động như GLP-1, tăng tiết insulin, giảm cảm giác đói'
  };

  return mechanisms[drugName.toLowerCase()] || 'Cơ chế hoạt động không rõ';
}

function getDrugSideEffects(drugName) {
  const sideEffects = {
    'metformin': 'Buồn nôn, tiêu chảy, vị kim loại trong miệng, không gây tăng cân',
    'gliclazide': 'Hạ đường huyết (hypoglycemia), tăng cân, mệt mỏi, chóng mặt',
    'glimepiride': 'Hạ đường huyết, tăng cân, buồn nôn, đau đầu',
    'sitagliptin': 'Đau đầu, sổ mũi, đau cổ họng, hiếm khi viêm tuyến tụy',
    'insulin': 'Hạ đường huyết (nguy hiểm), phát ban ở chỗ tiêm, tăng cân',
    'empagliflozin': 'Nhiễm trùng đường tiểu sinh dục, đau đầu, khát nước',
    'dapagliflozin': 'Nhiễm trùng đường tiểu sinh dục, buồn nôn, tiêu chảy',
    'acarbose': 'Đầy hơi, tiêu chảy, đau bụng, chứng khí',
    'pioglitazone': 'Tăng cân, giữ nước, chứng phù chi, tăng nguy hiểm hỏng xương',
    'liraglutide': 'Buồn nôn (đặc biệt lần đầu), nôn, tiêu chảy, đau đầu',
    'semaglutide': 'Buồn nôn, nôn, tiêu chảy, đau đầu'
  };

  return sideEffects[drugName.toLowerCase()] || 'Các tác dụng phụ thường gặp có thể xảy ra';
}

function getDrugContraindications(drugName) {
  const contraindications = {
    'metformin': 'Suy thận nặng (eGFR < 30), bệnh gan nặng, phổi yếu, người sắp mổ, uống rượu quá nhiều',
    'gliclazide': 'Tiểu đường type 1, suy thận nặng, bệnh gan nặng, dị ứng sulfonamides, mang thai',
    'glimepiride': 'Type 1 diabetes, suy thận nặng, suy gan, dị ứng với sulfonamides',
    'sitagliptin': 'Dị ứng sitagliptin, bệnh tuyến tụy nặng, suy thận nặng',
    'insulin': 'Chỉ tuyệt đối chống chỉ định khi hạ đường huyết nặng',
    'empagliflozin': 'Type 1 diabetes, suy thận nặng (eGFR < 20), bệnh thận từng phần',
    'dapagliflozin': 'Type 1 diabetes, suy thận nặng, bệnh tuyến tụy nặng',
    'acarbose': 'Suy thận nặng (eGFR < 30), bệnh đường tiêu hóa nặng, thai kỳ',
    'pioglitazone': 'Suy tim NYHA III-IV, bệnh gan nặng, đái tháo đường type 1',
    'liraglutide': 'Bệnh tuyến tụy gia đình, ung thư tuỷ tuyến, type 1 diabetes',
    'semaglutide': 'Bệnh tuyến tụy gia đình, ung thư tuỷ tuyến, type 1 diabetes'
  };

  return contraindications[drugName.toLowerCase()] || 'Tham khảo bác sĩ trước khi sử dụng';
}

module.exports = {
  searchDrug,
  getDrugInfo,
  fetchFullDrugDetails,
  getDiabetesDrugInfo
};
