import localforage from 'localforage';

const VOICE_STORE_KEY = 'dia_plus_voice_alerts';

// Cấu hình kho lưu trữ riêng cho voice
localforage.config({
  name: 'DiaPlusApp',
  storeName: 'voice_store'
});

export const ALERT_TYPES = {
  MED_MORNING: 'med_morning',
  MED_NOON: 'med_noon',
  MED_EVENING: 'med_evening',
  MED_NIGHT: 'med_night',
  SUGAR_HIGH: 'sugar_high',
  SUGAR_LOW: 'sugar_low',
  BP_LOW: 'bp_low'
};

export const DEFAULT_TTS_TEXTS = {
  [ALERT_TYPES.MED_MORNING]: "Chào bạn, đã đến giờ uống thuốc buổi sáng. Hãy mở ứng dụng để xem danh sách thuốc nhé!",
  [ALERT_TYPES.MED_NOON]: "Chào bạn, đã đến giờ uống thuốc buổi trưa rồi.",
  [ALERT_TYPES.MED_EVENING]: "Chào bạn, đã đến giờ uống thuốc buổi chiều.",
  [ALERT_TYPES.MED_NIGHT]: "Chào bạn, đã đến giờ uống thuốc buổi tối. Nhớ uống thuốc đúng cữ nhé.",
  [ALERT_TYPES.SUGAR_HIGH]: "Cảnh báo, đường huyết của bạn đang tăng sát ngưỡng nguy hiểm. Hãy uống ngay một cốc nước lọc lớn, ngừng ăn đồ ngọt và theo dõi sát sao. Nhờ người nhà hỗ trợ nếu thấy mệt.",
  [ALERT_TYPES.SUGAR_LOW]: "Cảnh báo, đường huyết của bạn đang quá thấp! Hãy uống ngay nước đường hoặc ăn kẹo ngọt. Nghỉ ngơi tại chỗ và báo ngay cho người thân.",
  [ALERT_TYPES.BP_LOW]: "Cảnh báo, huyết áp của bạn đang bị tụt thấp. Xin hãy giữ bình tĩnh, nằm nghỉ ngơi hoặc ngồi tại chỗ, không đứng dậy đột ngột. Hãy gọi ngay cho người nhà."
};

export const voiceAlertService = {
  /**
   * Lưu đoạn ghi âm (blob) cho một loại cảnh báo
   */
  async saveVoice(alertType, audioBlob) {
    try {
      const data = await this.getAllSettings();
      // Đọc Blob thành Base64 để lưu vào localforage cho an toàn
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          data[alertType] = {
            useCustomVoice: true,
            audioBase64: reader.result
          };
          await localforage.setItem(VOICE_STORE_KEY, data);
          resolve(true);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    } catch (error) {
      console.error('Error saving voice:', error);
      throw error;
    }
  },

  /**
   * Lấy toàn bộ cấu hình voice
   */
  async getAllSettings() {
    try {
      return (await localforage.getItem(VOICE_STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Bật/tắt việc sử dụng custom voice cho một cảnh báo
   */
  async toggleCustomVoice(alertType, useCustomVoice) {
    const data = await this.getAllSettings();
    if (data[alertType]) {
      data[alertType].useCustomVoice = useCustomVoice;
      await localforage.setItem(VOICE_STORE_KEY, data);
    }
  },

  /**
   * Xóa file ghi âm của một cảnh báo
   */
  async deleteVoice(alertType) {
    const data = await this.getAllSettings();
    if (data[alertType]) {
      delete data[alertType];
      await localforage.setItem(VOICE_STORE_KEY, data);
    }
  },

  /**
   * Phát một âm thanh cảnh báo (Custom Voice hoặc Google TTS)
   */
  async playAlert(alertType) {
    try {
      const data = await this.getAllSettings();
      const setting = data[alertType];

      if (setting && setting.useCustomVoice && setting.audioBase64) {
        // Phát custom voice
        const audio = new Audio(setting.audioBase64);
        await audio.play();
      } else {
        // Phát Google TTS
        const text = DEFAULT_TTS_TEXTS[alertType];
        if (!text) return;

        // Xóa các lời đọc đang dở
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        
        // Try to explicitly select a Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.includes('vi') || v.name.toLowerCase().includes('viet'));
        if (viVoice) {
          utterance.voice = viVoice;
        }

        utterance.rate = 1.0;
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("Lỗi khi phát cảnh báo giọng nói: ", e);
    }
  },
  
  /**
   * Kiểm tra xem người dùng đã cài đặt ít nhất một custom voice chưa
   */
  async hasAnyCustomVoice() {
    const data = await this.getAllSettings();
    return Object.values(data).some(setting => setting && setting.audioBase64);
  }
};
