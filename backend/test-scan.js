const { analyzePrescription } = require('./src/modules/scan/scan.service.js');
const fs = require('fs');

async function test() {
  try {
    // We will just pass a dummy buffer and rely on the Tesseract failure to trigger Gemini direct
    // Actually, Tesseract will fail with a dummy buffer and it will use Gemini direct.
    // We need to provide a valid image buffer so Gemini doesn't complain about invalid image.
    // Let's create a 1x1 png pixel in base64.
    const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const buf = Buffer.from(imgBase64, 'base64');
    const result = await analyzePrescription(buf, "image/png");
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
