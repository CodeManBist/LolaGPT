import "dotenv/config";

const SYSTEM_PROMPT = `You are LolaGPT, a helpful, knowledgeable, and friendly AI assistant. You provide clear, accurate, and well-structured responses. When writing code, use proper formatting with language-specific code blocks. Be concise but thorough.`;

const AVAILABLE_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Fast)" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B" },
];

const getGroqAiApiResponse = async (messages, model = "llama-3.3-70b-versatile") => {
    const conversationMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-20),
    ];

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages: conversationMessages,
            max_tokens: 4096,
            temperature: 0.7,
        }),
        signal: AbortSignal.timeout(60000),
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("Invalid response from AI model");
    }

    return data.choices[0].message.content;
};

// Streaming version — returns a ReadableStream from Groq
const getGroqAiStreamResponse = async (messages, model = "llama-3.3-70b-versatile") => {
    const conversationMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-20),
    ];

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages: conversationMessages,
            max_tokens: 4096,
            temperature: 0.7,
            stream: true,
        }),
        signal: AbortSignal.timeout(60000),
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    return response.body;
};

export { AVAILABLE_MODELS, getGroqAiStreamResponse };
export default getGroqAiApiResponse;
