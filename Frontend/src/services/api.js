import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken")
      window.location.href = "/"
    }
    return Promise.reject(error)
  },
)

// Auth API calls
export const authAPI = {
  register: (username, email, password, confirmPassword) =>
    apiClient.post("/api/auth/register", { username, email, password, confirmPassword }),

  login: (email, password) => apiClient.post("/api/auth/login", { email, password }),
}

// User API calls
export const userAPI = {
  getProfile: () => apiClient.get("/api/user/profile"),

  updateProfile: (username, email) => apiClient.put("/api/user/profile", { username, email }),

  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiClient.post("/api/user/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    }),
}

// Chat API calls
export const chatAPI = {
  sendMessage: (threadId, message, model) => apiClient.post("/api/chat/chat", { threadId, message, model }),

  getThreads: () => apiClient.get("/api/chat/thread"),

  getThread: (threadId) => apiClient.get(`/api/chat/thread/${threadId}`),

  deleteThread: (threadId) => apiClient.delete(`/api/chat/thread/${threadId}`),

  renameThread: (threadId, title) => apiClient.put(`/api/chat/thread/${threadId}`, { title }),

  searchThreads: (query) => apiClient.get(`/api/chat/search`, { params: { q: query } }),

  getModels: () => apiClient.get("/api/chat/models"),

  // SSE streaming — returns the raw URL + token for EventSource
  getStreamUrl: () => `${API_BASE_URL}/api/chat/chat/stream`,
}

export { API_BASE_URL }
export default apiClient
