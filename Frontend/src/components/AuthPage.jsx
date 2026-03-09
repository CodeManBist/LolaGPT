"use client"

import { useState } from "react"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"
import "../styles/AuthPage.css"

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <i className="fa-solid fa-robot"></i>
          </div>
          <h1>LolaGPT</h1>
          <p>{isLogin ? "Welcome back" : "Create your account"}</p>
        </div>
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} onLoginSuccess={onAuthSuccess} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} onRegisterSuccess={onAuthSuccess} />
        )}
      </div>
    </div>
  )
}
