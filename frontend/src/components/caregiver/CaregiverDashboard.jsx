import { useState, useRef } from 'react';
import {
  HeartHandshake,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Activity,
  Droplet,
  FileText,
  Check,
  Utensils,
  Footprints,
  Clock,
  ListTodo,
  Heart,
} from 'lucide-react';
import useRoleModeStore from '../../store/roleModeStore';
import Modal from '../common/Modal';
import RoleCircleSwitcher from '../common/RoleCircleSwitcher';
import styles from './CaregiverDashboard.module.css';

export default function CaregiverDashboard() {
  const caregiverData = useRoleModeStore((s) => s.caregiverData);
  const toggleCaregiverTask = useRoleModeStore((s) => s.toggleCaregiverTask);
  const addCaregiverVital = useRoleModeStore((s) => s.addCaregiverVital);
  const updateCaregiverDailyNote = useRoleModeStore((s) => s.updateCaregiverDailyNote);

  // Vitals State
  const [glucoseVal, setGlucoseVal] = useState('');
  const [glucoseTag, setGlucoseTag] = useState('Trước ăn sáng');
  const [bpPhotoPreview, setBpPhotoPreview] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [viewingPhotoModal, setViewingPhotoModal] = useState(null);

  // Filter tasks: 'all' | 'pending' | 'completed'
  const [taskFilter, setTaskFilter] = useState('all');

  // Daily note local inputs
  const [dailyNoteState, setDailyNoteState] = useState(caregiverData?.dailyNote || {});

  // Ref to handle photo upload for blood pressure monitor
  const bpFileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const dailyTasks = caregiverData?.dailyTasks || [];
  const totalTasks = dailyTasks.length;
  const doneTasks = dailyTasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - doneTasks;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const filteredTasks = dailyTasks.filter((task) => {
    if (taskFilter === 'pending') return !task.completed;
    if (taskFilter === 'completed') return task.completed;
    return true;
  });

  // Xử lý chụp ảnh máy đo huyết áp
  const handleBpPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      setBpPhotoPreview(base64Url);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveBpPhoto = (e) => {
    e.preventDefault();
    if (!bpPhotoPreview) {
      showToast('⚠️ Vui lòng chụp ảnh máy đo huyết áp trước khi lưu');
      return;
    }
    addCaregiverVital({
      type: 'blood_pressure',
      photo: bpPhotoPreview,
      tag: 'Ảnh máy đo huyết áp',
      status: 'normal',
    });
    setBpPhotoPreview(null);
    showToast('✅ Đã lưu ảnh máy đo huyết áp thành công!');
  };

  // Cảnh báo hạ đường huyết thông minh
  const numGlucose = parseFloat(glucoseVal);
  const isHypo = !isNaN(numGlucose) && numGlucose > 0 && numGlucose < 3.9;
  const isHyper = !isNaN(numGlucose) && numGlucose > 10.0;

  const handleSaveGlucose = (e) => {
    e.preventDefault();
    if (!numGlucose || isNaN(numGlucose)) {
      showToast('⚠️ Vui lòng nhập số đường huyết hợp lệ (mmol/L)');
      return;
    }
    addCaregiverVital({
      type: 'glucose',
      value: numGlucose,
      tag: glucoseTag,
      status: isHypo ? 'danger_low' : isHyper ? 'warning_high' : 'normal',
    });
    setGlucoseVal('');
    showToast(`✅ Đã ghi nhận đường huyết: ${numGlucose} mmol/L`);
  };

  const handleSaveDailyNote = (e) => {
    e.preventDefault();
    updateCaregiverDailyNote(dailyNoteState);
    showToast('✅ Đã lưu và báo cáo ca trực thành công!');
  };

  // Ca trực thời gian thật: Sáng (06:00 - 18:00) hoặc Tối (18:00 - 06:00)
  const currentHour = new Date().getHours();
  const currentShift = currentHour >= 6 && currentHour < 18 ? 'Sáng' : 'Tối';

  // Tên Hộ lý không kèm chữ "(Hộ lý)"
  const rawNurseName = caregiverData?.nurseName || 'Cô Lan';
  const cleanNurseName =
    rawNurseName
      .replace(/\s*\([^)]*Hộ\s*lý[^)]*\)/gi, '')
      .replace(/\s*Hộ\s*lý/gi, '')
      .trim() || 'Cô Lan';

  return (
    <div className={styles.container}>
      {/* Hidden File input for blood pressure monitor photo */}
      <input
        ref={bpFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleBpPhotoChange}
      />

      {/* Header ca trực của Người chăm sóc (Hộ lý) */}
      <header className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.shiftTag}>
            <Clock size={15} />
            <span>Ca trực: {currentShift}</span>
          </div>
          <RoleCircleSwitcher />
        </div>

        <div className={styles.caregiverIdentity}>
          <div className={styles.nurseInfoWrap}>
            <span className={styles.nurseLabel}>Họ và tên:</span>
            <span className={styles.nurseName}>{cleanNurseName}</span>
          </div>
          <div className={styles.wishMessage}>
            Chúc cô làm việc một ngày vui vẻ{' '}
            <Heart size={14} className={styles.heartIcon} fill="#ef4444" color="#ef4444" />
          </div>
        </div>
      </header>

      {/* Toast thông báo */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 99999,
            whiteSpace: 'nowrap',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Thẻ tổng kết tiến độ ca trực */}
      <section className={styles.progressCard}>
        <div className={styles.progressTop}>
          <span className={styles.progressTitle}>Tiến độ nhiệm vụ ca trực</span>
          <span className={styles.progressPercent}>{progressPercent}% hoàn thành</span>
        </div>

        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>

        <div className={styles.quickPillGrid}>
          <div className={styles.quickPill}>
            <span className={styles.quickPillLabel}>Nhiệm vụ ca trực</span>
            <span className={styles.quickPillValue}>{doneTasks}/{totalTasks} việc</span>
          </div>
          <div className={styles.quickPill}>
            <span className={styles.quickPillLabel}>Đo đường huyết</span>
            <span className={styles.quickPillValue}>
              {caregiverData?.vitalsLogs?.find((v) => v.type === 'glucose')?.value
                ? `${caregiverData.vitalsLogs.find((v) => v.type === 'glucose').value} mmol/L`
                : 'Chưa đo'}
            </span>
          </div>
          <div className={styles.quickPill}>
            <span className={styles.quickPillLabel}>Bữa ăn sáng</span>
            <span className={styles.quickPillValue}>
              {dailyTasks.find((t) => t.id === 'task_2')?.completed ? 'Đã ăn xong' : 'Chưa xong'}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 1: DANH SÁCH NHIỆM VỤ CA TRỰC HÔM NAY (THEO DÕI & TICK NHANH) */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <ListTodo size={20} color="#d97706" />
            <h2 className={styles.sectionTitle}>Nhiệm vụ trong ngày</h2>
          </div>
          <span className={styles.sectionBadge}>
            {doneTasks}/{totalTasks} xong
          </span>
        </div>

        {/* Bộ lọc nhiệm vụ */}
        <div className={styles.taskFilterRow}>
          {[
            { key: 'all', label: `Tất cả (${totalTasks})` },
            { key: 'pending', label: `Chưa xong (${pendingTasks})` },
            { key: 'completed', label: `Đã xong (${doneTasks})` },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.taskFilterBtn} ${taskFilter === f.key ? styles.taskFilterBtnActive : ''}`}
              onClick={() => setTaskFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Danh sách nhiệm vụ theo ngày (không chi tiết từng viên thuốc) */}
        <div className={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: 13 }}>
              {taskFilter === 'pending'
                ? '🎉 Tuyệt vời! Hộ lý đã hoàn thành tất cả nhiệm vụ trong ca trực.'
                : 'Chưa có nhiệm vụ nào trong danh mục này.'}
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = Boolean(task.completed);
              return (
                <div
                  key={task.id}
                  className={`${styles.taskItem} ${isDone ? styles.taskItemDone : ''}`}
                >
                  <div className={styles.taskMain}>
                    <div className={styles.taskIconWrap}>
                      {task.category === 'medication' ? (
                        <Pill size={18} />
                      ) : task.category === 'meal' ? (
                        <Utensils size={18} />
                      ) : task.category === 'vital' ? (
                        <Activity size={18} />
                      ) : task.category === 'activity' ? (
                        <Footprints size={18} />
                      ) : (
                        <Clock size={18} />
                      )}
                    </div>
                    <div className={styles.taskInfo}>
                      <h3 className={styles.taskTitle}>{task.title}</h3>
                      <div className={styles.taskMeta}>
                        {task.time && (
                          <span className={styles.taskTimeBadge}>
                            {task.time}
                          </span>
                        )}
                        {isDone ? (
                          <span style={{ color: '#15803d', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ✓ Xong lúc {task.completedAt || 'hôm nay'}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>○ Đang chờ</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={isDone ? styles.taskDoneBtn : styles.taskCheckBtn}
                    onClick={() => {
                      toggleCaregiverTask(task.id);
                      showToast(isDone ? '↩️ Đã hoàn tác' : `✅ Đã xong: ${task.title}`);
                    }}
                    title={isDone ? 'Bấm để hoàn tác nếu đánh dấu nhầm' : 'Bấm để đánh dấu hoàn thành'}
                  >
                    {isDone ? (
                      <>
                        <Check size={13} strokeWidth={2.8} /> Đã xong
                      </>
                    ) : (
                      <>
                        <Check size={13} strokeWidth={2.8} /> Tick xong
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION 2: ĐO & GHI NHẬN ĐƯỜNG HUYẾT & CHỤP ẢNH MÁY ĐO HUYẾT ÁP */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <Activity size={18} color="#dc2626" />
            <h2 className={styles.sectionTitle}>Chỉ số sức khỏe</h2>
          </div>
          <span className={styles.sectionBadge}>Hộ lý đo</span>
        </div>

        {/* Ô NHẬP ĐƯỜNG HUYẾT */}
        <form onSubmit={handleSaveGlucose} className={styles.vitalsForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <Droplet size={15} color="#dc2626" /> Chỉ số đường huyết của Cụ (mmol/L)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 5.8 hoặc 6.5"
                value={glucoseVal}
                onChange={(e) => setGlucoseVal(e.target.value)}
                className={styles.textInput}
              />
              <button type="submit" className={styles.saveVitalBtn}>
                Lưu
              </button>
            </div>
          </div>

          <div className={styles.tagRow}>
            {['Trước ăn sáng', 'Sau ăn 2h', 'Trước ngủ', 'Khi thấy mệt'].map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.tagBtn} ${glucoseTag === t ? styles.tagBtnActive : ''}`}
                onClick={() => setGlucoseTag(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* CẢNH BÁO HẠ ĐƯỜNG HUYẾT (QUY TẮC 15-15) */}
          {isHypo && (
            <div className={styles.hypoAlert}>
              <div className={styles.hypoAlertHead}>
                <AlertTriangle size={18} />
                <span>🚨 CẢNH BÁO: HẠ ĐƯỜNG HUYẾT NGUY HIỂM ({numGlucose} mmol/L)!</span>
              </div>
              <p className={styles.hypoAlertBody}>
                Đường huyết dưới 3.9 mmol/L có thể khiến cụ chóng mặt, ngất xỉu. Hộ lý cần thực hiện ngay:
              </p>
              <div className={styles.hypoRulesBox}>
                ⏱️ <strong>ÁP DỤNG QUY TẮC 15-15:</strong>
                <br />1. Cho cụ uống ngay 1/2 cốc nước đường (hoặc 1 hộp sữa có đường, 3 viên kẹo).
                <br />2. Cho cụ nằm nghỉ tại chỗ, sau <strong>15 phút</strong> đo lại đường huyết.
                <br />3. Nếu sau 15 phút vẫn &lt; 3.9 mmol/L, gọi ngay người nhà hoặc 115!
              </div>
            </div>
          )}

          {isHyper && (
            <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: 14, padding: 12, fontSize: 12, color: '#92400e', lineHeight: 1.4 }}>
              ⚠️ <strong>Đường huyết tăng cao ({numGlucose} mmol/L):</strong> Cho cụ uống thêm 1 cốc nước ấm, tránh ăn đồ ngọt và theo dõi sát sao.
            </div>
          )}
        </form>

        {/* CHỤP ẢNH MÁY ĐO HUYẾT ÁP - KHÔNG CẦN NHẬP SỐ */}
        <div className={styles.bpPhotoBox}>
          <label className={styles.inputLabel}>
            💓 Huyết áp & Nhịp tim (Chụp ảnh màn hình máy đo)
          </label>

          {bpPhotoPreview ? (
            <div className={styles.bpPhotoPreviewBox}>
              <img
                src={bpPhotoPreview}
                alt="Ảnh máy đo huyết áp"
                className={styles.bpPhotoPreviewImg}
              />
              <button
                type="button"
                className={styles.bpRemovePhotoBtn}
                onClick={() => setBpPhotoPreview(null)}
              >
                ✕ Chụp lại
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.bpPhotoBtn}
              onClick={() => bpFileInputRef.current?.click()}
            >
              <Camera size={16} /> Chụp ảnh máy đo huyết áp
            </button>
          )}

          {bpPhotoPreview && (
            <button
              type="button"
              className={styles.saveVitalBtn}
              onClick={handleSaveBpPhoto}
              style={{ width: '100%', padding: '11px' }}
            >
              Lưu & Báo cáo ảnh máy đo
            </button>
          )}
        </div>

        {/* LỊCH SỬ CHỈ SỐ GẦN NHẤT ĐÃ GHI - KHÔNG BAO GIỜ BỊ RỚT DÒNG */}
        {caregiverData?.vitalsLogs?.length > 0 && (
          <div className={styles.vitalHistoryList}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>
              Chỉ số vừa đo hôm nay:
            </span>
            {caregiverData.vitalsLogs.slice(0, 3).map((item) => (
              <div key={item.id} className={styles.vitalHistoryItem}>
                <div className={styles.vitalHistoryHead}>
                  <span className={styles.vitalHistoryVal}>
                    {item.type === 'glucose'
                      ? `🩸 Đường huyết: ${item.value} mmol/L`
                      : '💓 Huyết áp: Đã chụp ảnh máy đo'}
                  </span>
                  <span className={styles.vitalHistoryMeta}>
                    {item.time} · {item.loggedBy}
                  </span>
                </div>
                {item.type === 'glucose' && item.tag && (
                  <div className={styles.vitalHistoryTag}>
                    Thời điểm: {item.tag}
                  </div>
                )}
                {item.type === 'blood_pressure' && item.photo && (
                  <div style={{ marginTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => setViewingPhotoModal(item.photo)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#0284c7',
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        borderRadius: 6,
                        padding: '2px 8px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📷 Xem ảnh máy đo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: SỔ NHẬT KÝ CHĂM SÓC HÀNG NGÀY */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <FileText size={18} color="#0284c7" />
            <h2 className={styles.sectionTitle}>Nhật ký chăm sóc</h2>
          </div>
          <span className={styles.sectionBadge}>Gửi con cháu</span>
        </div>

        <form onSubmit={handleSaveDailyNote} className={styles.vitalsForm}>
          <div className={styles.noteItem}>
            <label className={styles.noteLabel}>🍲 Bữa ăn & Dinh dưỡng của Cụ</label>
            <textarea
              className={styles.noteInput}
              value={dailyNoteState.meals || ''}
              onChange={(e) => setDailyNoteState({ ...dailyNoteState, meals: e.target.value })}
              placeholder="VD: Cụ ăn hết 1 bát cháo yến mạch, uống đủ nước, không bỏ bữa..."
            />
          </div>

          <div className={styles.noteItem}>
            <label className={styles.noteLabel}>😊 Tinh thần & Vận động</label>
            <textarea
              className={styles.noteInput}
              value={dailyNoteState.mood || ''}
              onChange={(e) => setDailyNoteState({ ...dailyNoteState, mood: e.target.value })}
              placeholder="VD: Cụ vui vẻ, tỉnh táo, đã đi dạo 15 phút quanh sân..."
            />
          </div>

          <div className={styles.noteItem}>
            <label className={styles.noteLabel}>🌙 Giấc ngủ & Thể trạng</label>
            <textarea
              className={styles.noteInput}
              value={dailyNoteState.sleep || ''}
              onChange={(e) => setDailyNoteState({ ...dailyNoteState, sleep: e.target.value })}
              placeholder="VD: Cụ ngủ sâu giấc từ 21:30 đến 06:00, không bị giật mình..."
            />
          </div>

          <div className={styles.noteItem}>
            <label className={styles.noteLabel}>📝 Lời nhắn gửi riêng cho Con Cháu</label>
            <textarea
              className={styles.noteInput}
              value={dailyNoteState.generalNotes || ''}
              onChange={(e) => setDailyNoteState({ ...dailyNoteState, generalNotes: e.target.value })}
              placeholder="VD: Thuốc Metformin chỉ còn 2 ngày nữa là hết, gia đình chuẩn bị mua thêm nhé..."
            />
          </div>

          {/* NÚT LƯU & BÁO CÁO Ở CHÍNH GIỮA */}
          <button type="submit" className={styles.saveNoteBtn}>
            Lưu & Báo cáo
          </button>
        </form>
      </section>

      {/* Modal Xem Ảnh Phóng To */}
      {viewingPhotoModal && (
        <Modal
          isOpen={Boolean(viewingPhotoModal)}
          onClose={() => setViewingPhotoModal(null)}
          title="Xem Ảnh Bằng Chứng"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <img
              src={viewingPhotoModal}
              alt="Ảnh phóng to"
              style={{
                width: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                background: '#000',
              }}
            />
            <button
              type="button"
              onClick={() => setViewingPhotoModal(null)}
              style={{
                padding: '11px',
                borderRadius: 12,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
