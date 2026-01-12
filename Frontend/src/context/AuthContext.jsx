"use client"

import { createContext, useState, useEffect } from "react"

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("authToken"))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if token exists and validate it
    if (token) {
      validateToken()
    } else {
      setLoading(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem("authToken")
        setToken(null)
      }
    } catch (error) {
      console.error("Token validation failed:", error)
      localStorage.removeItem("authToken")
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (token, userData) => {
    localStorage.setItem("authToken", token)
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>
}
