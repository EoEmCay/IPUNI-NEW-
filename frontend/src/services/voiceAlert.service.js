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
  SUGAR_LOW: 'sugar_low'
};

export const DEFAULT_TTS_TEXTS = {
  [ALERT_TYPES.MED_ALL]: "Chào bạn, đã đến giờ uống thuốc.",
  [ALERT_TYPES.SUGAR_HIGH]: "Chào bạn, hãy uống ngay một cốc nước lọc lớn và tạm ngưng ăn đồ ngọt nhé. Hiện tại chỉ số đường huyết đang hơi cao một chút. Hãy nghỉ ngơi thư giãn và theo dõi thêm.",
  [ALERT_TYPES.SUGAR_LOW]: "Chào bạn, hãy uống ngay nửa ly nước đường, nước trái cây hoặc ăn một vài viên kẹo ngọt nhé. Hiện tại chỉ số đường huyết đang hơi thấp. Bạn hãy nghỉ ngơi tại chỗ và báo cho người nhà biết."
};

// Kích hoạt nạp voice sớm cho các trình duyệt Android (load bất đồng bộ)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
  window.speechSynthesis.getVoices(); // Gọi lần đầu để kích hoạt trigger
}

export const voiceAlertService = {
  currentAudio: null,
  
  /**
   * Dừng âm thanh đang phát
   */
  stopAlert() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    window.speechSynthesis.cancel();
  },

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
  async playAlert(alertType, medsToTake = [], onEndedCallback = null) {
    try {
      this.stopAlert();
      
      const data = await this.getAllSettings();
      const setting = data[alertType];

      if (setting && setting.useCustomVoice && setting.audioBase64) {
        // Phát custom voice
        this.currentAudio = new Audio(setting.audioBase64);
        if (onEndedCallback) {
          this.currentAudio.onended = onEndedCallback;
        }
        await this.currentAudio.play();
      } else {
        // Phát Google TTS
        let text = DEFAULT_TTS_TEXTS[alertType];
        if (!text) {
          if (onEndedCallback) onEndedCallback();
          return;
        }

        // Nếu là nhắc thuốc và có danh sách thuốc
        if (alertType.startsWith('med_') && medsToTake.length > 0) {
          text += ` Các thuốc cần uống là: ${medsToTake.join(', ')}.`;
        }
        
        // Cần chuyển toàn bộ chữ về in thường. 
        // Lỗi phổ biến trên Android: Google TTS sẽ "đánh vần" từng chữ cái nếu từ đó viết HOA toàn bộ (VD: PARACETAMOL -> P-A-R...)
        const spokenText = text.toLowerCase();
        
        const utterance = new SpeechSynthesisUtterance(spokenText);
        if (onEndedCallback) {
          utterance.onend = onEndedCallback;
          utterance.onerror = onEndedCallback;
        }
        // Force language regardless of what voice is chosen
        utterance.lang = 'vi-VN';
        
        // Try to explicitly select a Vietnamese voice (Google TTS or system default vi-VN)
        let voices = window.speechSynthesis.getVoices();
        
        // Cứu cánh cho Android nếu getVoices() vẫn rỗng:
        if (voices.length === 0) {
          // Thử lấy lại lần nữa
          voices = window.speechSynthesis.getVoices();
        }

        let viVoice = voices.find(v => 
          v.lang === 'vi-VN' || 
          v.lang === 'vi_VN' ||
          v.name === 'Google Tiếng Việt' ||
          v.name.includes('Linh') ||
          v.name.includes('Vietnamese')
        );
        if (!viVoice) {
          viVoice = voices.find(v => v.lang.includes('vi'));
        }
        
        if (viVoice) {
          utterance.voice = viVoice;
          // Đảm bảo lang khớp với voice để không bị xung đột trên một số máy Android
          utterance.lang = viVoice.lang; 
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
