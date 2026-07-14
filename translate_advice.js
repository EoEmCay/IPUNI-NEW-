const fs = require('fs');
const path = require('path');

const data = {
  vi: {
    "Rau xanh & Chất xơ": "Rau xanh & Chất xơ",
    "Ngũ cốc nguyên hạt": "Ngũ cốc nguyên hạt",
    "Protein nạc": "Protein nạc",
    "Đường và đồ ngọt": "Đường và đồ ngọt",
    "Tinh bột trắng": "Tinh bột trắng",
    "Rượu bia": "Rượu bia",
    "Đi bộ sau bữa ăn": "Đi bộ sau bữa ăn",
    "Tập thể dục nhẹ": "Tập thể dục nhẹ",
    "Hạ đường huyết (< 3.9 mmol/L)": "Hạ đường huyết (< 3.9 mmol/L)",
    "Tăng đường huyết (> 13.9 mmol/L)": "Tăng đường huyết (> 13.9 mmol/L)",
    
    "Rau cải, bông cải, đậu bắp giúp ổn định đường huyết": "Rau cải, bông cải, đậu bắp giúp ổn định đường huyết",
    "Gạo lứt, yến mạch thay thế gạo trắng": "Gạo lứt, yến mạch thay thế gạo trắng",
    "Cá, ức gà, đậu hũ giúp no lâu, ít ảnh hưởng đường huyết": "Cá, ức gà, đậu hũ giúp no lâu, ít ảnh hưởng đường huyết",
    "Tránh nước ngọt, bánh kẹo, đường tinh luyện": "Tránh nước ngọt, bánh kẹo, đường tinh luyện",
    "Hạn chế cơm trắng, bánh mì trắng, bún, phở": "Hạn chế cơm trắng, bánh mì trắng, bún, phở",
    "Tránh uống rượu bia khi bụng đói, có thể gây hạ đường huyết": "Tránh uống rượu bia khi bụng đói, có thể gây hạ đường huyết",
    "15-30 phút đi bộ sau ăn giúp hạ đường huyết tự nhiên": "15-30 phút đi bộ sau ăn giúp hạ đường huyết tự nhiên",
    "30 phút/ngày, 5 ngày/tuần: đi bộ, đạp xe, bơi lội": "30 phút/ngày, 5 ngày/tuần: đi bộ, đạp xe, bơi lội",
    "Run tay, vã mồ hôi, chóng mặt — xử lý ngay!": "Run tay, vã mồ hôi, chóng mặt — xử lý ngay!",
    "Khát nước nhiều, tiểu nhiều, mờ mắt — liên hệ bác sĩ": "Khát nước nhiều, tiểu nhiều, mờ mắt — liên hệ bác sĩ"
  },
  en: {
    "Rau xanh & Chất xơ": "Green Vegetables & Fiber",
    "Ngũ cốc nguyên hạt": "Whole Grains",
    "Protein nạc": "Lean Protein",
    "Đường và đồ ngọt": "Sugar and Sweets",
    "Tinh bột trắng": "White Starch",
    "Rượu bia": "Alcohol",
    "Đi bộ sau bữa ăn": "Walk after meals",
    "Tập thể dục nhẹ": "Light Exercise",
    "Hạ đường huyết (< 3.9 mmol/L)": "Low Blood Sugar (< 3.9 mmol/L)",
    "Tăng đường huyết (> 13.9 mmol/L)": "High Blood Sugar (> 13.9 mmol/L)",
    
    "Rau cải, bông cải, đậu bắp giúp ổn định đường huyết": "Cabbage, broccoli, and okra help stabilize blood sugar",
    "Gạo lứt, yến mạch thay thế gạo trắng": "Substitute white rice with brown rice or oats",
    "Cá, ức gà, đậu hũ giúp no lâu, ít ảnh hưởng đường huyết": "Fish, chicken breast, and tofu keep you full and minimally affect blood sugar",
    "Tránh nước ngọt, bánh kẹo, đường tinh luyện": "Avoid soft drinks, candies, and refined sugar",
    "Hạn chế cơm trắng, bánh mì trắng, bún, phở": "Limit white rice, white bread, and noodles",
    "Tránh uống rượu bia khi bụng đói, có thể gây hạ đường huyết": "Avoid alcohol on an empty stomach to prevent hypoglycemia",
    "15-30 phút đi bộ sau ăn giúp hạ đường huyết tự nhiên": "A 15-30 minute walk after meals naturally lowers blood sugar",
    "30 phút/ngày, 5 ngày/tuần: đi bộ, đạp xe, bơi lội": "30 mins/day, 5 days/week: walking, cycling, or swimming",
    "Run tay, vã mồ hôi, chóng mặt — xử lý ngay!": "Trembling, sweating, dizziness — treat immediately!",
    "Khát nước nhiều, tiểu nhiều, mờ mắt — liên hệ bác sĩ": "Excessive thirst, frequent urination, blurred vision — contact a doctor"
  },
  lo: {
    "Rau xanh & Chất xơ": "ຜັກສີຂຽວ & ເສັ້ນໄຍ",
    "Ngũ cốc nguyên hạt": "ທັນຍາພືດ",
    "Protein nạc": "ໂປຣຕີນບໍ່ມີໄຂມັນ",
    "Đường và đồ ngọt": "ນ້ຳຕານແລະຂອງຫວານ",
    "Tinh bột trắng": "ທາດແປ້ງສີຂາວ",
    "Rượu bia": "ເຄື່ອງດື່ມທີ່ມີແອນກໍຮໍ",
    "Đi bộ sau bữa ăn": "ຍ່າງຫຼັງຈາກອາຫານ",
    "Tập thể dục nhẹ": "ອອກກຳລັງກາຍເບົາ",
    "Hạ đường huyết (< 3.9 mmol/L)": "ນ້ຳຕານໃນເລືອດຕ່ຳ (< 3.9 mmol/L)",
    "Tăng đường huyết (> 13.9 mmol/L)": "ນ້ຳຕານໃນເລືອດສູງ (> 13.9 mmol/L)",
    
    "Rau cải, bông cải, đậu bắp giúp ổn định đường huyết": "ກະລ່ຳປີ, ບຣອກໂຄລີ, ແລະ ໝາກຖົ່ວຊ່ວຍຮັກສາລະດັບນ້ຳຕານໃນເລືອດ",
    "Gạo lứt, yến mạch thay thế gạo trắng": "ປ່ຽນເຂົ້າຂາວດ້ວຍເຂົ້າກ້ອງ ຫຼື ເຂົ້າໂອດ",
    "Cá, ức gà, đậu hũ giúp no lâu, ít ảnh hưởng đường huyết": "ປາ, ເອິກໄກ່, ແລະ ເຕົ້າຫູ້ຊ່ວຍໃຫ້ທ່ານອີ່ມ ແລະ ມີຜົນກະທົບຕໍ່ນ້ຳຕານໜ້ອຍທີ່ສຸດ",
    "Tránh nước ngọt, bánh kẹo, đường tinh luyện": "ຫຼີກເວັ້ນເຄື່ອງດື່ມຫວານ, ເຂົ້າໜົມ, ແລະ ນ້ຳຕານກັ່ນ",
    "Hạn chế cơm trắng, bánh mì trắng, bún, phở": "ຈຳກັດເຂົ້າຂາວ, ເຂົ້າຈີ່ຂາວ, ແລະ ເສັ້ນໝີ່",
    "Tránh uống rượu bia khi bụng đói, có thể gây hạ đường huyết": "ຫຼີກເວັ້ນການດື່ມເຫຼົ້າເມື່ອທ້ອງຫວ່າງ ເພື່ອປ້ອງກັນນ້ຳຕານໃນເລືອດຕ່ຳ",
    "15-30 phút đi bộ sau ăn giúp hạ đường huyết tự nhiên": "ຍ່າງ 15-30 ນາທີຫຼັງຈາກກິນອາຫານ ຊ່ວຍຫຼຸດນ້ຳຕານໃນເລືອດ",
    "30 phút/ngày, 5 ngày/tuần: đi bộ, đạp xe, bơi lội": "30 ນາທີ/ມື້, 5 ມື້/ອາທິດ: ຍ່າງ, ຂີ່ລົດຖີບ, ຫຼື ລອຍນ້ຳ",
    "Run tay, vã mồ hôi, chóng mặt — xử lý ngay!": "ສັ່ນ, ເຫື່ອອອກ, ວິນຫົວ — ຈັດການທັນທີ!",
    "Khát nước nhiều, tiểu nhiều, mờ mắt — liên hệ bác sĩ": "ຫິວນ້ຳຫຼາຍ, ຍ່ຽວເລື້ອຍໆ, ຕາພາງ — ຕິດຕໍ່ທ່ານໝໍ"
  }
};

const langs = ['vi', 'en', 'lo'];

langs.forEach(lang => {
  const filePath = path.join(__dirname, `frontend/src/i18n/${lang}.js`);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('adviceData: {')) {
    console.log(`${lang} already has adviceData`);
    return;
  }
  
  // Create adviceData string
  const str = `  adviceData: {\n` + Object.entries(data[lang]).map(([k, v]) => `    "${k}": "${v}"`).join(',\n') + `\n  },\n`;
  
  // Insert right before "advice: {"
  content = content.replace('  advice: {', str + '  advice: {');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${lang}.js`);
});
