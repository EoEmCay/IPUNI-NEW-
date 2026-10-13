import localforage from 'localforage';
import api from './api';

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
  FAMILY: 'family_missed'
};

export const DEFAULT_TTS_TEXTS = {
  [ALERT_TYPES.MED_ALL]: "Chào bạn, đã đến giờ uống thuốc.",
  [ALERT_TYPES.SUGAR_HIGH]: "Chào bạn, hãy uống ngay một cốc nước lọc lớn và tạm ngưng ăn đồ ngọt nhé. Hiện tại chỉ số đường huyết đang hơi cao một chút. Hãy nghỉ ngơi thư giãn và theo dõi thêm.",
  [ALERT_TYPES.FAMILY]: "Người nhà của bạn chưa uống thuốc. Hãy gọi điện nhắc nhé.",
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
  audioCtx: null,
  analyser: null,
  freqData: null,
  isSynthSpeaking: false,
  lastWordPulseAt: 0,

  /**
   * Kết nối thẻ Audio với Web Audio API AnalyserNode để đọc biên độ tần số sóng âm thật theo thời gian thực
   */
  _attachAnalyser(audioEl) {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.65;

      const source = this.audioCtx.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(this.audioCtx.destination);

      this.analyser = analyser;
      this.freqData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      console.warn('Không gắn được AnalyserNode cho audio:', e.message);
    }
  },

  /**
   * Lấy mảng độ cao thực tế (0..100) của `barCount` vạch sóng âm từ âm thanh đang phát
   */
  getPlaybackBands(barCount = 44) {
    if (this.analyser && this.freqData && this.currentAudio && !this.currentAudio.paused) {
      this.analyser.getByteFrequencyData(this.freqData);
      const bins = this.freqData.length;
      const usableBins = Math.max(12, Math.floor(bins * 0.72));
      const result = new Array(barCount);
      for (let i = 0; i < barCount; i++) {
        // Đối xứng nhẹ từ giữa ra 2 bên hoặc trải đều dải tần giọng nói người (80Hz - 4000Hz)
        const binIdx = Math.min(
          usableBins - 1,
          Math.floor((i / barCount) * usableBins)
        );
        const raw = this.freqData[binIdx] || 0; // 0..255
        const normalized = Math.min(100, Math.max(8, Math.round((raw / 230) * 100)));
        result[i] = normalized;
      }
      return result;
    }

    // Nếu đang phát bằng trình đọc dự phòng của trình duyệt (speechSynthesis)
    if (this.isSynthSpeaking && typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      const now = performance.now();
      // Tạo biên độ theo nhịp phát âm thực tế (boundary)
      const sincePulse = now - this.lastWordPulseAt;
      const env = sincePulse < 240 ? 1 - sincePulse / 320 : 0.35 + 0.25 * Math.sin(now * 0.018);
      const result = new Array(barCount);
      for (let i = 0; i < barCount; i++) {
        const wave = Math.abs(Math.sin(now * 0.015 + i * 0.45)) * 75 * env;
        result[i] = Math.min(96, Math.max(8, Math.round(10 + wave)));
      }
      return result;
    }

    return null;
  },

  /**
   * Dừng âm thanh đang phát
   */
  stopAlert() {
    this.isSynthSpeaking = false;
    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.analyser = null;
    this.freqData = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
    } catch {
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
  // ttsText: câu đọc thay cho câu mặc định khi chưa ghi âm
  async playAlert(alertType, medsToTake = [], onEndedCallback = null, ttsText = null) {
    try {
      this.stopAlert();
      
      const data = await this.getAllSettings();
      const setting = data[alertType];

      if (setting && setting.useCustomVoice && setting.audioBase64) {
        // Phát custom voice
        this.currentAudio = new Audio(setting.audioBase64);
        this._attachAnalyser(this.currentAudio);
        if (onEndedCallback) {
          this.currentAudio.onended = onEndedCallback;
          this.currentAudio.onerror = onEndedCallback;
        }
        await this.currentAudio.play();
      } else {
        let text = ttsText || DEFAULT_TTS_TEXTS[alertType];
        if (!text) {
          if (onEndedCallback) onEndedCallback();
          return;
        }

        // Chỉ nối danh sách thuốc khi dùng câu mặc định (không truyền ttsText riêng)
        if (!ttsText && alertType.startsWith('med_') && medsToTake.length > 0) {
          text += ` Các thuốc cần uống là: ${medsToTake.join(', ')}.`;
        }

        const playedOnServer = await this._speakWithServerTTS(text, onEndedCallback);
        if (!playedOnServer) {
          this._speakWithBrowserTTS(text, onEndedCallback);
        }
      }
    } catch (e) {
      console.error("Lỗi khi phát cảnh báo giọng nói: ", e);
      if (onEndedCallback) onEndedCallback();
    }
  },

  /**
   * Thử phát giọng "chị Google dịch" qua backend (đồng bộ cho mọi người dùng).
   * Trả về true nếu phát thành công, false nếu lỗi (để gọi nơi khác rơi về giọng máy).
   */
  async _speakWithServerTTS(text, onEndedCallback) {
    try {
      const res = await api.get('/tts/speak', {
        params: { text },
        responseType: 'blob',
        timeout: 10000,
      });
      const url = URL.createObjectURL(res.data);
      this.currentAudio = new Audio(url);
      this._attachAnalyser(this.currentAudio);
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        if (onEndedCallback) onEndedCallback();
      };
      this.currentAudio.onerror = () => {
        URL.revokeObjectURL(url);
        if (onEndedCallback) onEndedCallback();
      };
      await this.currentAudio.play();
      return true;
    } catch (e) {
      console.warn('Không phát được giọng Google dịch từ server, chuyển sang giọng máy:', e.message);
      return false;
    }
  },

  /**
   * Giọng dự phòng: TTS có sẵn của trình duyệt/hệ điều hành. Chỉ dùng khi không gọi
   * được giọng đồng bộ từ server.
   */
  _speakWithBrowserTTS(text, onEndedCallback) {
    const spokenText = text.toLowerCase();

    const utterance = new SpeechSynthesisUtterance(spokenText);
    this.isSynthSpeaking = true;
    this.lastWordPulseAt = performance.now();

    utterance.onboundary = () => {
      this.lastWordPulseAt = performance.now();
    };
    utterance.onend = () => {
      this.isSynthSpeaking = false;
      if (onEndedCallback) onEndedCallback();
    };
    utterance.onerror = () => {
      this.isSynthSpeaking = false;
      if (onEndedCallback) onEndedCallback();
    };
    utterance.lang = 'vi-VN';

    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Thử lấy lại lần nữa
      voices = window.speechSynthesis.getVoices();
    }

    // Ưu tiên đúng giọng "chị Google" Tiếng Việt (chất lượng tốt hơn hẳn giọng hệ
    // thống mặc định, đỡ nghe robot/chậm chạp). Google thường liệt kê 2 bản cho cùng
    // 1 giọng: bản mạng (localService: false, âm thanh tự nhiên hơn - đây mới là bản
    // "chị Google" thật) và bản cài sẵn trên máy (localService: true, chất lượng thấp
    // hơn) - ưu tiên bản mạng nếu có cả hai.
    const isGoogleVi = (v) => v.lang.toLowerCase().startsWith('vi') && v.name.toLowerCase().includes('google');
    const googleViVoices = voices.filter(isGoogleVi);
    let viVoice = googleViVoices.find((v) => v.localService === false) || googleViVoices[0];

    if (!viVoice) {
      viVoice = voices.find(v =>
        v.lang === 'vi-VN' ||
        v.lang === 'vi_VN' ||
        v.name === 'Google Tiếng Việt' ||
        v.name.includes('Linh') ||
        v.name.includes('Vietnamese')
      );
    }
    if (!viVoice) {
      viVoice = voices.find(v => v.lang.toLowerCase().startsWith('vi'));
    }

    if (viVoice) {
      utterance.voice = viVoice;
      // Đảm bảo lang khớp với voice để không bị xung đột trên một số máy Android
      utterance.lang = viVoice.lang;
    }

    // Tốc độ đọc nhanh, dứt khoát hơn mặc định (1.0 nghe chậm/nhàm chán) - vẫn trong
    // ngưỡng nghe rõ chữ, không bị vấp âm.
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  },

  /**
   * Kiểm tra xem người dùng đã cài đặt ít nhất một custom voice chưa
   */
  async hasAnyCustomVoice() {
    const data = await this.getAllSettings();
    return Object.values(data).some(setting => setting && setting.audioBase64);
  }
};
