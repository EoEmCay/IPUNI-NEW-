import api from './api';

const compressImage = (file, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas is empty'));
          const compressedFile = new File([blob], file.name || 'image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const scanService = {
  analyzePrescription: async (imageFile) => {
    try {
      const compressedImage = await compressImage(imageFile);
      const formData = new FormData();
      formData.append('image', compressedImage);
      return api.post('/scan/prescription', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
    } catch (error) {
      console.error("Image compression failed:", error);
      // Fallback to original image if compression fails
      const formData = new FormData();
      formData.append('image', imageFile);
      return api.post('/scan/prescription', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
    }
  },
};
