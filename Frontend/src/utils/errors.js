export const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message) {
    return error.message
  }
  return "An unexpected error occurred"
}

export const isNetworkError = (error) => {
  return !error.response || error.code === "ERR_NETWORK"
}

export const isAuthError = (error) => {
  return error.response?.status === 401
}

export const isValidationError = (error) => {
  return error.response?.status === 400
}
