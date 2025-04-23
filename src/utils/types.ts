export type ServerResponse<T = null> =
  | {
      success: true
      data?: T
    }
  | {
      success: false
      errorMessage: string
    }
