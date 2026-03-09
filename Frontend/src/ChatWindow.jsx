"use client"

import { useContext, useState, useEffect } from "react"
import "./ChatWindow.css"
import Chat from "./Chat"
import { MyContext } from "./MyContext"
import { useAuth } from "./hooks/useAuth"
import UserProfile from "./components/UserProfile"
import { chatAPI, API_BASE_URL } from "./services/api"

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
    setAllThreads,
    token,
    sidebarOpen,
    setSidebarOpen,
  } = useContext(MyContext)

  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [streamingText, setStreamingText] = useState(null)
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile")
  const [models, setModels] = useState([])
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  // Fetch available models
  useEffect(() => {
    if (token) {
      chatAPI.getModels().then(res => setModels(res.data)).catch(() => {})
    }
  }, [token])

  const suggestedPrompts = [
    "Explain quantum computing in simple terms",
    "Write a Python function to sort a list",
    "What are the best practices for REST APIs?",
    "Help me write a cover letter",
  ]

  // ---- REFRESH THREADS ----
  const refreshThreads = async () => {
    try {
      const threadsRes = await chatAPI.getThreads()
      const filtered = threadsRes.data.map((t) => ({
        threadId: t.threadId,
        title: t.title,
      }))
      setAllThreads(filtered)
    } catch (_) {}
  }

  // ---- SEND MESSAGE WITH STREAMING ----
  const getReply = async (messageOverride) => {
    const messageToSend = messageOverride || prompt
    if (!messageToSend.trim() || !token || loading) return

    setLoading(true)
    setNewChat(false)
    setStreamingText("")
    setReply(null)

    // Optimistic UI: show user message immediately
    setPrevChats((prev) => [
      ...prev,
      { role: "user", content: messageToSend },
    ])
    setPrompt("")

    try {
      // Use SSE streaming
      const response = await fetch(`${API_BASE_URL}/api/chat/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageToSend,
          threadId: currThreadId,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) logout()
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

        for (const line of lines) {
          const data = line.replace("data: ", "").trim()
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.content) {
              fullResponse += parsed.content
              setStreamingText(fullResponse)
            }
          } catch (e) {
            if (e.message === "Stream failed") throw e
          }
        }
      }

      // Streaming complete — finalize
      setStreamingText(null)
      setPrevChats((prev) => [
        ...prev,
        { role: "assistant", content: fullResponse },
      ])
      setReply(fullResponse)

      refreshThreads()
    } catch (err) {
      // Fallback to non-streaming if SSE fails
      try {
        const response = await chatAPI.sendMessage(currThreadId, messageToSend, selectedModel)
        setStreamingText(null)
        setPrevChats((prev) => [
          ...prev,
          { role: "assistant", content: response.data.response },
        ])
        setReply(response.data.response)
        refreshThreads()
      } catch (err2) {
        if (err2.response?.status === 401) logout()
        setPrevChats((prev) => prev.slice(0, -1))
        setPrompt(messageToSend)
        setStreamingText(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // ---- REGENERATE RESPONSE ----
  const regenerateResponse = async () => {
    if (prevChats.length < 2 || loading) return

    let lastUserMsg = null
    for (let i = prevChats.length - 1; i >= 0; i--) {
      if (prevChats[i].role === "user") {
        lastUserMsg = prevChats[i].content
        break
      }
    }
    if (!lastUserMsg) return

    // Remove last assistant message
    setPrevChats((prev) => {
      const newChats = [...prev]
      if (newChats[newChats.length - 1]?.role === "assistant") {
        newChats.pop()
      }
      return newChats
    })

    setReply(null)
    await getReply(lastUserMsg)
  }

  // ---- EXPORT CHAT ----
  const exportChat = () => {
    if (prevChats.length === 0) return

    const markdown = prevChats
      .map((msg) => {
        const role = msg.role === "user" ? "**You**" : "**LolaGPT**"
        return `${role}:\n${msg.content}\n`
      })
      .join("\n---\n\n")

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lolagpt-chat-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---- UI ----
  const isEmptyChat = prevChats.length === 0 && !loading

  const currentModelName = models.find(m => m.id === selectedModel)?.name || "Llama 3.3 70B"

  return (
    <div className="chatWindow">
      <div className="navbar">
        <div className="navbar-left">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(prev => !prev)}>
            <i className="fa-solid fa-bars"></i>
          </button>
          <div className="model-selector" onClick={() => setShowModelDropdown(prev => !prev)}>
            <span>LolaGPT</span>
            <span className="model-badge">{currentModelName}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.6rem" }}></i>
          </div>
          {showModelDropdown && (
            <div className="model-dropdown">
              {models.map((m) => (
                <div
                  key={m.id}
                  className={`model-option ${m.id === selectedModel ? "active" : ""}`}
                  onClick={() => { setSelectedModel(m.id); setShowModelDropdown(false) }}
                >
                  {m.name}
                  {m.id === selectedModel && <i className="fa-solid fa-check"></i>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="navbar-right">
          {prevChats.length > 0 && (
            <button className="icon-btn" onClick={exportChat} title="Export chat">
              <i className="fa-solid fa-download"></i>
            </button>
          )}
          <div className="userIconDiv" onClick={() => setIsOpen(!isOpen)}>
            <span className="userIcon">
              <i className="fa-solid fa-user"></i>
            </span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="dropDown">
          <div className="dropDownItem" onClick={() => { setShowProfile(true); setIsOpen(false) }}>
            <i className="fa-solid fa-gear"></i> Profile Settings
          </div>
          <div className="dropDownItem" onClick={() => { logout(); setIsOpen(false) }}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </div>
        </div>
      )}

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

      {isEmptyChat ? (
        <div className="welcome-screen">
          <div className="welcome-icon">
            <i className="fa-solid fa-robot"></i>
          </div>
          <h1>How can I help you today?</h1>
          <p className="welcome-subtitle">Start a conversation or try one of these prompts</p>
          <div className="suggested-prompts">
            {suggestedPrompts.map((sp, idx) => (
              <button
                key={idx}
                className="suggested-prompt-btn"
                onClick={() => {
                  setPrompt(sp)
                  getReply(sp)
                }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <Chat streamingText={streamingText} />
          {loading && !streamingText && (
            <div className="loading-indicator">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          {!loading && prevChats.length > 0 && prevChats[prevChats.length - 1]?.role === "assistant" && (
            <button className="regenerate-btn" onClick={regenerateResponse}>
              <i className="fa-solid fa-rotate"></i> Regenerate response
            </button>
          )}
        </>
      )}

      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && getReply()}
            disabled={loading}
          />
          <div id="submit" onClick={() => !loading && getReply()}>
            <i className={loading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-paper-plane"}></i>
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
