"use client"

import "./Sidebar.css"
import { useContext, useEffect, useState, useRef } from "react"
import { MyContext } from "./MyContext"
import { useAuth } from "./hooks/useAuth"
import { v1 as uuidv1 } from "uuid"
import { chatAPI } from "./services/api"
import logoImg from "./assets/blacklogo.png"

const Sidebar = () => {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
    token,
    sidebarOpen,
    setSidebarOpen,
  } = useContext(MyContext)

  const { user, logout } = useAuth()
  const [editingThreadId, setEditingThreadId] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // ---------------- FETCH ALL THREADS ----------------
  const getAllThreads = async () => {
    if (!token) return

    try {
      const response = await chatAPI.getThreads()
      const filtered = response.data.map((thread) => ({
        threadId: thread.threadId,
        title: thread.title,
      }))
      setAllThreads(filtered)
    } catch (err) {
      console.error("Failed to fetch threads:", err)
    }
  }

  useEffect(() => {
    if (token) getAllThreads()
  }, [token])

  // ---------------- CREATE NEW CHAT ----------------
  const createNewChat = () => {
    setNewChat(true)
    setPrompt("")
    setReply(null)
    setCurrThreadId(uuidv1())
    setPrevChats([])
  }

  // ---------------- CHANGE THREAD ----------------
  const changeThread = async (threadId) => {
    if (!token) return

    setCurrThreadId(threadId)
    setSidebarOpen(false)

    try {
      const response = await chatAPI.getThread(threadId)
      setPrevChats(response.data)
      setNewChat(false)
      setReply(null)
    } catch (err) {
      console.error("Failed to load thread:", err)
    }
  }

  // ---------------- DELETE THREAD ----------------
  const deleteThread = async (threadId) => {
    if (!token) return

    try {
      await chatAPI.deleteThread(threadId)

      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId)
      )

      if (threadId === currThreadId) {
        createNewChat()
      }
    } catch (err) {
      console.error("Failed to delete thread:", err)
    }
  }

  // ---------------- RENAME THREAD ----------------
  const startRename = (e, threadId, currentTitle) => {
    e.stopPropagation()
    setEditingThreadId(threadId)
    setEditTitle(currentTitle)
  }

  const saveRename = async (threadId) => {
    if (!editTitle.trim()) {
      setEditingThreadId(null)
      return
    }

    try {
      await chatAPI.renameThread(threadId, editTitle.trim())
      setAllThreads((prev) =>
        prev.map((t) =>
          t.threadId === threadId ? { ...t, title: editTitle.trim() } : t
        )
      )
    } catch (err) {
      console.error("Failed to rename thread:", err)
    } finally {
      setEditingThreadId(null)
    }
  }

  // ---------------- FILTERED THREADS ----------------
  const filteredThreads = allThreads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ---------------- UI ----------------
  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <section className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <button onClick={createNewChat} className="new-chat-btn">
          <img src={logoImg} alt="logo" className="logo" />
          <span>
            <i className="fa-solid fa-pen-to-square"></i>
          </span>
        </button>

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ul className="history">
          {filteredThreads.map((thread) => (
            <li
              key={thread.threadId}
              onClick={() => changeThread(thread.threadId)}
              className={thread.threadId === currThreadId ? "highlighted" : ""}
            >
              {editingThreadId === thread.threadId ? (
                <input
                  className="rename-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(thread.threadId)
                    if (e.key === "Escape") setEditingThreadId(null)
                  }}
                  onBlur={() => saveRename(thread.threadId)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className="title">{thread.title}</span>
              )}

              <div className="thread-actions">
                <i
                  className="fa-solid fa-pen"
                  onClick={(e) => startRename(e, thread.threadId, thread.title)}
                ></i>
                <i
                  className="fa-solid fa-trash"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteThread(thread.threadId)
                  }}
                ></i>
              </div>
            </li>
          ))}
        </ul>

        <div className="user-section">
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="user-details">
                <p className="username">{user.username}</p>
                <p className="email">{user.email}</p>
              </div>
            </div>
          )}

          <button className="logout-btn" onClick={logout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Logout
          </button>
        </div>

        <div className="sign">
          <p>By LolaGPT</p>
        </div>
      </section>
    </>
  )
}

export default Sidebar
