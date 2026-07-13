import localforage from 'localforage';

const VOICE_STORE_KEY = 'dia_plus_voice_alerts';

// Cấu hình kho lưu trữ riêng cho voice
localforage.config({
  name: 'DiaPlusApp',
  storeName: 'voice_store'
});

export const ALERT_TYPES = {
  MED_ALL: 'med_all',
  SUGAR_HIGH: 'sugar_high',
  SUGAR_LOW: 'sugar_low',
  BP_LOW: 'bp_low'
};

export const DEFAULT_TTS_TEXTS = {
  [ALERT_TYPES.MED_ALL]: "Chào bạn, đã đến giờ uống thuốc.",
  [ALERT_TYPES.SUGAR_HIGH]: "Chào bạn, hãy uống ngay một cốc nước lọc lớn và tạm ngưng ăn đồ ngọt nhé. Hiện tại chỉ số đường huyết đang hơi cao một chút. Hãy nghỉ ngơi thư giãn và theo dõi thêm.",
  [ALERT_TYPES.SUGAR_LOW]: "Chào bạn, hãy uống ngay nửa ly nước đường, nước trái cây hoặc ăn một vài viên kẹo ngọt nhé. Hiện tại chỉ số đường huyết đang hơi thấp. Bạn hãy nghỉ ngơi tại chỗ và báo cho người nhà biết.",
  [ALERT_TYPES.BP_LOW]: "Chào bạn, hãy từ từ nằm xuống hoặc ngồi nghỉ tại chỗ nhé, tuyệt đối không đứng dậy đột ngột. Hiện tại chỉ số huyết áp đang hơi thấp. Bạn cứ hít thở sâu, giữ bình tĩnh và nhờ người gọi cho người thân."
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
  async playAlert(alertType, medsToTake = []) {
    try {
      const data = await this.getAllSettings();
      const setting = data[alertType];

      if (setting && setting.useCustomVoice && setting.audioBase64) {
        // Phát custom voice
        const audio = new Audio(setting.audioBase64);
        await audio.play();
      } else {
        // Phát Google TTS
        let text = DEFAULT_TTS_TEXTS[alertType];
        if (!text) return;

        // Nếu là nhắc thuốc và có danh sách thuốc
        if (alertType.startsWith('med_') && medsToTake.length > 0) {
          text += ` Các thuốc cần uống là: ${medsToTake.join(', ')}.`;
        }

        // Xóa các lời đọc đang dở
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        
        // Try to explicitly select a Vietnamese voice (Google TTS or system default vi-VN)
        const voices = window.speechSynthesis.getVoices();
        let viVoice = voices.find(v => v.name === 'Google Tiếng Việt' || v.lang === 'vi-VN' || v.lang === 'vi_VN');
        if (!viVoice) {
          viVoice = voices.find(v => v.lang.includes('vi') || v.name.toLowerCase().includes('viet'));
        }
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
