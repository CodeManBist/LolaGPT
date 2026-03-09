import express from "express"
import Thread from "../models/Thread.js"
import getGroqAiApiResponse, { getGroqAiStreamResponse, AVAILABLE_MODELS } from "../utils/groqAi.js"
import authMiddleware from "../middleware/auth.js"

const router = express.Router()
const MAX_MESSAGE_LENGTH = 4000

// GET AVAILABLE MODELS
router.get("/models", authMiddleware, (req, res) => {
  res.json(AVAILABLE_MODELS)
})

router.get("/thread", authMiddleware, async (req, res) => {
  try {
    const threads = await Thread.find({ userId: req.userId }).sort({ updatedAt: -1 })
    res.json(threads)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "failed to fetch threads from database" })
  }
})

router.get("/thread/:threadId", authMiddleware, async (req, res) => {
  const { threadId } = req.params

  try {
    const thread = await Thread.findOne({ threadId, userId: req.userId })

    if (!thread) {
      return res.status(404).json({ error: "Thread not found or access denied" })
    }

    res.json(thread.messages)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "failed to fetch a particular thread from database" })
  }
})

router.delete("/thread/:threadId", authMiddleware, async (req, res) => {
  const { threadId } = req.params

  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId, userId: req.userId })

    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found or access denied" })
    }

    res.status(200).json({ message: "Thread deleted successfully" })
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "failed to delete the thread" })
  }
})

router.post("/chat", authMiddleware, async (req, res) => {
  const { threadId, message } = req.body

  if (!threadId || !message) {
    return res.status(400).json({ error: "threadId and message are required" })
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` })
  }

  try {
    let thread = await Thread.findOne({ threadId, userId: req.userId })

    if (!thread) {
      thread = new Thread({
        threadId,
        userId: req.userId,
        title: message.substring(0, 100),
        messages: [{ role: "user", content: message }],
      })
    } else {
      thread.messages.push({ role: "user", content: message })
    }

    // Build conversation history for AI context
    const conversationHistory = thread.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const assistantResponse = await getGroqAiApiResponse(conversationHistory)

    thread.messages.push({ role: "assistant", content: assistantResponse })
    thread.updatedAt = new Date()

    await thread.save()
    res.json({ response: assistantResponse })
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Chat processing failed" })
  }
})

// STREAMING CHAT (SSE)
router.post("/chat/stream", authMiddleware, async (req, res) => {
  const { threadId, message, model } = req.body

  if (!threadId || !message) {
    return res.status(400).json({ error: "threadId and message are required" })
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` })
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })

  try {
    let thread = await Thread.findOne({ threadId, userId: req.userId })

    if (!thread) {
      thread = new Thread({
        threadId,
        userId: req.userId,
        title: message.substring(0, 100),
        messages: [{ role: "user", content: message }],
      })
    } else {
      thread.messages.push({ role: "user", content: message })
    }

    const conversationHistory = thread.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const stream = await getGroqAiStreamResponse(conversationHistory, model)
    const reader = stream.getReader()
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
          const content = parsed.choices?.[0]?.delta?.content || ""
          if (content) {
            fullResponse += content
            res.write(`data: ${JSON.stringify({ content })}\n\n`)
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    // Save complete response to thread
    thread.messages.push({ role: "assistant", content: fullResponse })
    thread.updatedAt = new Date()
    await thread.save()

    res.write(`data: [DONE]\n\n`)
    res.end()
  } catch (err) {
    console.log(err)
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`)
    res.end()
  }
})

// RENAME THREAD
router.put("/thread/:threadId", authMiddleware, async (req, res) => {
  const { threadId } = req.params
  const { title } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" })
  }

  try {
    const thread = await Thread.findOne({ threadId, userId: req.userId })

    if (!thread) {
      return res.status(404).json({ error: "Thread not found or access denied" })
    }

    thread.title = title.trim().substring(0, 100)
    await thread.save()

    res.json({ message: "Thread renamed successfully", title: thread.title })
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Failed to rename thread" })
  }
})

// SEARCH THREADS
router.get("/search", authMiddleware, async (req, res) => {
  const { q } = req.query

  if (!q || !q.trim()) {
    return res.status(400).json({ error: "Search query is required" })
  }

  try {
    const threads = await Thread.find({
      userId: req.userId,
      $or: [
        { title: { $regex: q.trim(), $options: "i" } },
        { "messages.content": { $regex: q.trim(), $options: "i" } },
      ],
    }).sort({ updatedAt: -1 })

    res.json(threads)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Search failed" })
  }
})

export default router
