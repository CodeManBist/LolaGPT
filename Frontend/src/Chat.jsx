import "./Chat.css"
import { useContext, useState, useEffect, useRef } from 'react';
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// Extract text from React children recursively
const extractText = (children) => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return String(children ?? '');
};

// Pre block wrapper with copy button
const PreBlock = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);

  // Extract language from the child <code> element
  const codeChild = children?.props;
  const className = codeChild?.className || '';
  const lang = className.replace(/.*language-/, '').replace(/.*hljs.*/, '') || 'code';

  const handleCopy = async () => {
    const text = extractText(codeChild?.children);
    try {
      await navigator.clipboard.writeText(text.replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang">{lang}</span>
        <button className="copy-btn" onClick={handleCopy}>
          <i className={copied ? "fa-solid fa-check" : "fa-regular fa-clipboard"}></i>
          {copied ? " Copied!" : " Copy"}
        </button>
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
};

// Inline code only
const InlineCode = ({ children, className, ...props }) => {
  if (className) {
    // This is inside a <pre>, let it render normally
    return <code className={className} {...props}>{children}</code>;
  }
  return <code className="inline-code" {...props}>{children}</code>;
};

const Chat = ({ streamingText }) => {
  const bottomRef = useRef(null);
  const { newChat, prevChats } = useContext(MyContext);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prevChats, streamingText]);

  const markdownComponents = {
    pre: PreBlock,
    code: InlineCode,
  };

  // While streaming, show text live; prevChats won't have the assistant msg yet
  const isStreaming = streamingText !== null && streamingText !== undefined;

  return (
    <>
      {newChat && prevChats.length === 0 && <h1 className="new-chat-heading">Start a New Chat!</h1>}
      <div className="chats">
        {prevChats.map((chat, idx) => (
          <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
            {chat.role === "user" ? (
              <p className="userMessage">{chat.content}</p>
            ) : (
              <div className="assistant-message">
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {chat.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="gptDiv" key="streaming">
            <div className="assistant-message">
              <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {streamingText}
              </ReactMarkdown>
              <span className="typing-cursor">|</span>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>
    </>
  );
};

export default Chat
