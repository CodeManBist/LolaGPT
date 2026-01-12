import express from "express"
import Thread from "../models/Thread.js"
import getGroqAiApiResponse from "../utils/groqAi.js"
import authMiddleware from "../middleware/auth.js"

const router = express.Router()

//test
router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "abc",
      title: "Test New Thread2",
    })

    await thread.save()
    res.send(response)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "failed to save to database" })
  }
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
    res.status(400).json({ error: "threadId and message are required" })
    return
  }

  try {
    let thread = await Thread.findOne({ threadId, userId: req.userId })

    if (!thread) {
      thread = new Thread({
        threadId,
        userId: req.userId,
        title: message,
        messages: [{ role: "user", content: message }],
      })
    } else {
      thread.messages.push({ role: "user", content: message })
    }

    const assistantResponse = await getGroqAiApiResponse(message)

    thread.messages.push({ role: "assistant", content: assistantResponse })
    thread.updatedAt = new Date()

    await thread.save()
    res.json({ response: assistantResponse })
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Chat processing failed" })
  }
})

export default router
