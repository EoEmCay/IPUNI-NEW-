exports.seed = async function(knex) {
  await knex('advice').del();
  await knex('advice').insert([
    {
      category: 'should_eat',
      title: 'Rau xanh & Chất xơ',
      description: 'Rau cải, bông cải, đậu bắp giúp ổn định đường huyết',
      detail_content: 'Rau xanh giàu chất xơ giúp làm chậm quá trình hấp thu đường vào máu, giữ đường huyết ổn định sau bữa ăn. Nên ăn ít nhất 3-4 khẩu phần rau mỗi ngày. Các loại rau tốt nhất: rau cải xanh, bông cải xanh, rau muống, đậu bắp, cà chua, dưa leo.',
      icon_type: 'check',
      sort_order: 1,
      is_active: 1
    },
    {
      category: 'should_eat',
      title: 'Ngũ cốc nguyên hạt',
      description: 'Gạo lứt, yến mạch thay thế gạo trắng',
      detail_content: 'Ngũ cốc nguyên hạt có chỉ số đường huyết (GI) thấp hơn gạo trắng, giúp giải phóng năng lượng từ từ và duy trì đường huyết ổn định. Thay thế 50-70% cơm trắng bằng gạo lứt, hoặc ăn yến mạch vào buổi sáng.',
      icon_type: 'check',
      sort_order: 2,
      is_active: 1
    },
    {
      category: 'should_eat',
      title: 'Protein nạc',
      description: 'Cá, ức gà, đậu hũ giúp no lâu, ít ảnh hưởng đường huyết',
      detail_content: 'Protein giúp bạn no lâu hơn mà không làm tăng đường huyết đột ngột. Các nguồn protein tốt cho bệnh nhân tiểu đường: cá hồi, cá thu, ức gà, đậu hũ, trứng, sữa chua không đường. Nên ăn 2-3 khẩu phần protein mỗi ngày.',
      icon_type: 'check',
      sort_order: 3,
      is_active: 1
    },
    {
      category: 'should_avoid',
      title: 'Đường và đồ ngọt',
      description: 'Tránh nước ngọt, bánh kẹo, đường tinh luyện',
      detail_content: 'Đường và đồ ngọt làm tăng đường huyết rất nhanh. Tuyệt đối tránh: nước ngọt có ga, nước trái cây đóng hộp, bánh ngọt, kẹo, đường trắng, mật ong (ở lượng lớn). Nếu thèm ngọt, có thể dùng trái cây tươi với lượng vừa phải.',
      icon_type: 'cross',
      sort_order: 1,
      is_active: 1
    },
    {
      category: 'should_avoid',
      title: 'Tinh bột trắng',
      description: 'Hạn chế cơm trắng, bánh mì trắng, bún, phở',
      detail_content: 'Tinh bột trắng có chỉ số đường huyết cao, nhanh chóng chuyển hóa thành đường trong máu. Nên hạn chế: cơm trắng (không quá 1 chén/bữa), bánh mì trắng, bún, phở, bánh gạo. Thay thế bằng ngũ cốc nguyên hạt và rau củ.',
      icon_type: 'cross',
      sort_order: 2,
      is_active: 1
    },
    {
      category: 'should_avoid',
      title: 'Rượu bia',
      description: 'Tránh uống rượu bia khi bụng đói, có thể gây hạ đường huyết',
      detail_content: 'Rượu bia có thể gây hạ đường huyết nguy hiểm, đặc biệt khi bụng đói hoặc khi đang dùng thuốc tiểu đường. Nếu uống: không uống khi đói, uống cùng bữa ăn, giới hạn 1-2 đơn vị/ngày. Không uống nếu đường huyết đang thấp.',
      icon_type: 'cross',
      sort_order: 3,
      is_active: 1
    },
    {
      category: 'exercise',
      title: 'Đi bộ sau bữa ăn',
      description: '15-30 phút đi bộ sau ăn giúp hạ đường huyết tự nhiên',
      detail_content: 'Đi bộ nhẹ nhàng 15-30 phút sau bữa ăn giúp cơ thể sử dụng glucose hiệu quả hơn, từ đó hạ đường huyết sau ăn. Bắt đầu đi bộ khoảng 30-60 phút sau khi ăn xong. Tốc độ vừa phải, không cần nhanh.',
      icon_type: 'exercise',
      sort_order: 1,
      is_active: 1
    },
    {
      category: 'exercise',
      title: 'Tập thể dục nhẹ',
      description: '30 phút/ngày, 5 ngày/tuần: đi bộ, đạp xe, bơi lội',
      detail_content: 'Vận động thường xuyên giúp cơ thể nhạy cảm hơn với insulin, kiểm soát đường huyết tốt hơn và duy trì cân nặng khỏe mạnh. Khuyến nghị: ít nhất 150 phút vận động vừa/tuần. Các bài tập phù hợp: đi bộ, đạp xe, bơi lội, yoga, dưỡng sinh.',
      icon_type: 'exercise',
      sort_order: 2,
      is_active: 1
    },
    {
      category: 'danger_sign',
      title: 'Hạ đường huyết (< 3.9 mmol/L)',
      description: 'Run tay, vã mồ hôi, chóng mặt — xử lý ngay!',
      detail_content: 'Triệu chứng hạ đường huyết: run tay, vã mồ hôi, tim đập nhanh, chóng mặt, yếu sức, đói cồn cào, mờ mắt, khó tập trung. Xử lý ngay: Ăn ngay 15g đường nhanh (3 viên đường hoặc 150ml nước trái cây hoặc 1 muỗng canh mật ong). Nghỉ ngơi 15 phút rồi đo lại đường huyết. Nếu vẫn thấp hoặc không tỉnh táo, gọi cấp cứu 115 ngay lập tức.',
      icon_type: 'warning',
      sort_order: 1,
      is_active: 1
    },
    {
      category: 'danger_sign',
      title: 'Tăng đường huyết (> 13.9 mmol/L)',
      description: 'Khát nước nhiều, tiểu nhiều, mờ mắt — liên hệ bác sĩ',
      detail_content: 'Triệu chứng tăng đường huyết nguy hiểm: khát nước dữ dội, tiểu nhiều, mờ mắt, đau đầu, mệt mỏi, buồn nôn. Nếu đường huyết > 13.9 mmol/L kèm triệu chứng trên, cần liên hệ bác sĩ ngay. Nếu > 16.7 mmol/L hoặc có nôn mửa, khó thở — gọi cấp cứu 115.',
      icon_type: 'warning',
      sort_order: 2,
      is_active: 1
    }
  ]);
};
