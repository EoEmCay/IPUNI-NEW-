const { synthesizeVietnamese } = require('./tts.service');

// GET /api/v1/tts/speak?text=...
async function speak(req, res) {
  try {
    const text = req.query.text;
    const audioBuffer = await synthesizeVietnamese(text);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-store');
    res.send(audioBuffer);
  } catch (err) {
    res.status(err.status || 502).json({
      success: false,
      message: err.status ? err.message : 'Không thể tạo giọng đọc lúc này',
    });
  }
}

module.exports = { speak };
