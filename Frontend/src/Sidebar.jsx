"use client"

import "./Sidebar.css"
import { useContext, useEffect } from "react"
import { MyContext } from "./MyContext"
import { useAuth } from "./hooks/useAuth"
import { v1 as uuidv1 } from "uuid"

const API_BASE = "http://localhost:8080/api/chat"

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
  } = useContext(MyContext)

  const { user, logout } = useAuth()

  // ---------------- FETCH ALL THREADS ----------------
  const getAllThreads = async () => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/thread`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) logout()
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const filtered = data.map((thread) => ({
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

    try {
      const response = await fetch(`${API_BASE}/thread/${threadId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) logout()
        throw new Error(`HTTP ${response.status}`)
      }

      const messages = await response.json()

      setPrevChats(messages)
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
      const response = await fetch(`${API_BASE}/thread/${threadId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) logout()
        throw new Error(`HTTP ${response.status}`)
      }

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

  // ---------------- UI ----------------
  return (
    <section className="sidebar">
      <button onClick={createNewChat}>
        <img src="src/assets/blacklogo.png" alt="logo" className="logo" />
        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      <ul className="history">
        {allThreads.map((thread) => (
          <li
            key={thread.threadId}
            onClick={() => changeThread(thread.threadId)}
            className={thread.threadId === currThreadId ? "highlighted" : ""}
          >
            <span className="title">{thread.title}</span>

            <i
              className="fa-solid fa-trash"
              onClick={(e) => {
                e.stopPropagation()
                deleteThread(thread.threadId)
              }}
            ></i>
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
        <p>By LolaGPT 🤍</p>
      </div>
    </section>
  )
}

export default Sidebar
