"use client"

import { useContext, useState, useEffect } from "react"
import "./ChatWindow.css"
import Chat from "./Chat"
import { MyContext } from "./MyContext"
import { useAuth } from "./hooks/useAuth"
import UserProfile from "./components/UserProfile"
import { ScaleLoader } from "react-spinners"

const API_BASE = "http://localhost:8080/api/chat"

const ChatWindow = () => {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    prevChats,
    setPrevChats,
    setNewChat,
    token,
  } = useContext(MyContext)

  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // ---------------- SEND MESSAGE ----------------
  const getReply = async () => {
    if (!prompt.trim() || !token) return

    setLoading(true)
    setNewChat(false)

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: prompt,
          threadId: currThreadId,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) logout()
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setReply(data.response)
    } catch (err) {
      console.error("Chat failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // ---------------- UPDATE CHAT HISTORY ----------------
  useEffect(() => {
    if (!reply) return

    setPrevChats((prev) => [
      ...prev,
      { role: "user", content: prompt },
      { role: "assistant", content: reply },
    ])

    setPrompt("")
  }, [reply])

  // ---------------- UI ----------------
  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>
          LolaGPT <i className="fa-solid fa-chevron-down"></i>
        </span>
        <div className="userIconDiv" onClick={() => setIsOpen(!isOpen)}>
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="dropDown">
          <div className="dropDownItem" onClick={() => setShowProfile(true)}>
            <i className="fa-solid fa-gear"></i> Profile Settings
          </div>
          <div className="dropDownItem">
            <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan
          </div>
          <div className="dropDownItem" onClick={logout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </div>
        </div>
      )}

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

      <Chat />
      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
          />
          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p className="info">
          LolaGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}

export default ChatWindow
