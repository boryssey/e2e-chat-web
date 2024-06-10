export const stringToArrayBuffer = (str: string) => {
  return new TextEncoder().encode(str);
};
export const arrayBufferToString = (buf: ArrayBuffer) => {
  return new TextDecoder().decode(buf);
};
