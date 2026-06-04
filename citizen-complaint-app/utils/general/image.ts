const convertImageToBase64 = async (uri: string): Promise<string> => {
  if (!uri) return '';
  // Already converted to base64 in Step3 — skip re-conversion.
  // On Android, fetch() of a data: URI fails silently, so this guard is critical.
  if (uri.startsWith('data:')) return uri;
 
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
 
export default convertImageToBase64;
 