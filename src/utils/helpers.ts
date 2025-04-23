export const stringToArrayBuffer = (str: string) => {
  return new TextEncoder().encode(str)
}
export const arrayBufferToString = (buf: ArrayBuffer) => {
  return new TextDecoder().decode(buf)
}

export const getResponseError = (responseData: unknown, statusText: string) => {
  const errorMessage =
    responseData &&
    typeof responseData === 'object' &&
    'message' in responseData &&
    typeof responseData.message === 'string'
      ? responseData.message
      : statusText

  return errorMessage
}
