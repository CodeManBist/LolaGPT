"use client"

import { useState } from "react"
import "./App.css"
import Sidebar from "./Sidebar"
import ChatWindow from "./ChatWindow"
import { MyContext } from "./MyContext"
import { v1 as uuidv1 } from "uuid"
import { useAuth } from "./hooks/useAuth"
import AuthPage from "./components/AuthPage"

function App() {
  const { user, token, loading } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [reply, setReply] = useState(null)
  const [currThreadId, setCurrThreadId] = useState(uuidv1())
  const [prevChats, setPrevChats] = useState([])
  const [newChat, setNewChat] = useState(true)
  const [allThreads, setAllThreads] = useState([])

  const ProviderValues = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    newChat,
    setNewChat,
    prevChats,
    setPrevChats,
    allThreads,
    setAllThreads,
    token,
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!token || !user) {
    return <AuthPage onAuthSuccess={() => {}} />
  }

  return (
    <div className="app">
      <MyContext.Provider value={ProviderValues}>
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  )
}

export default App
