"use client";
import React, { useState, useRef, useEffect } from "react";

interface AiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AiChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("qwen/qwen3-8b:free");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim() === "") return;

    const userMessage: AiMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPEN_ROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "system",
                content:
                  "You are CodeAssist, an AI programming assistant. Provide helpful, concise answers to coding questions. Include code examples when appropriate. Keep explanations clear and focused.also give appropriate code snipets which the user can just copy paste.",
              },
              ...messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              { role: "user", content: input },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: AiMessage = {
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error with AI chat:", error);

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const models = [
    { id: "qwen/qwen3-8b:free", name: "Qwen 3 (8B)" },
    { id: "anthropic/claude-3-haiku:free", name: "Claude 3 Haiku" },
    { id: "google/gemma-1.1-7b-it:free", name: "Gemma 1.1 (7B)" },
    { id: "google/gemini-1.5-flash:free", name: "Gemini 1.5 Flash" },
    { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B" },
  ];

  return (
    <>
      <button
        id="aiChatButton"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
        )}
      </button>

      {/* AI Chat Box */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 w-80 h-96 bg-gray-800 shadow-xl rounded-lg border border-gray-700 flex flex-col overflow-hidden z-40">
          <div className="bg-gray-900 text-white p-3 font-semibold text-sm flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-400"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>Code AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Model Selector */}
          <div className="bg-gray-800 p-2 border-b border-gray-700">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-gray-700 text-gray-200 text-xs p-1.5 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto text-sm bg-gray-800 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                Ask me coding questions or help with your code!
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[85%] ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-600 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg"
                      : "mr-auto bg-gray-700 text-gray-200 rounded-br-lg rounded-tr-lg rounded-tl-lg"
                  }`}
                >
                  <div className="text-xs text-gray-300 mb-1">
                    {msg.role === "user" ? "You" : "AI Assistant"} ·{" "}
                    {formatTime(msg.timestamp)}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="mr-auto bg-gray-700 text-gray-200 p-2 rounded-lg max-w-[85%] flex items-center gap-2">
                <div className="animate-pulse">AI is thinking...</div>
                <div className="flex space-x-1">
                  <div
                    className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-gray-700 bg-gray-800"
          >
            <div className="flex">
              <input
                type="text"
                placeholder="Ask me anything about your code..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-l-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AiChat;
