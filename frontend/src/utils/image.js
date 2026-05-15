export async function fileToDataUrl(file, options = {}) {
  const {
    maxWidth = 640,
    maxHeight = 640,
    quality = 0.82,
    outputType = 'image/jpeg',
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Нужно выбрать изображение');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('Не удалось обработать изображение');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL(outputType, quality);
}
