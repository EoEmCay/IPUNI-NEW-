/**
 * Lưu / chia sẻ file — hoạt động cả trên web lẫn native iOS.
 *
 * Web:    tạo <a download> (như cũ).
 * Native: WKWebView CHẶN mọi download -> ghi vào Filesystem rồi mở Share sheet
 *         để người dùng lưu vào Files / gửi Zalo / in ra, v.v.
 */
import { isNative } from '../lib/native';

/** ArrayBuffer / Blob / string -> base64 (không kèm data: prefix). */
async function toBase64(data) {
  let blob;
  if (data instanceof Blob) blob = data;
  else if (data instanceof ArrayBuffer) blob = new Blob([data]);
  else blob = new Blob([data]);

  const buf = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * @param {Object} opts
 * @param {string} opts.fileName  vd 'bao-cao.pdf'
 * @param {Blob|ArrayBuffer|string} opts.data
 * @param {string} opts.mimeType  vd 'application/pdf'
 */
export async function saveOrShareFile({ fileName, data, mimeType }) {
  if (!isNative) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { method: 'download' };
  }

  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  const base64 = await toBase64(data);
  const write = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: fileName,
      text: 'Sổ theo dõi từ DIA+',
      url: write.uri,
      dialogTitle: 'Lưu hoặc chia sẻ báo cáo',
    });
    return { method: 'share', uri: write.uri };
  } catch (e) {
    // Người dùng bấm huỷ Share sheet -> file vẫn nằm trong Cache
    return { method: 'saved', uri: write.uri };
  }
}
