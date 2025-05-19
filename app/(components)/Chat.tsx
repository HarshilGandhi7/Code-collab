import React, { useState, useEffect, useRef } from "react";

interface ChatProps {
  socket: any;
  roomId: string;
  username: string;
}

interface ChatMessage {
  message: string;
  username: string;
  timestamp: Date;
}

const Chat: React.FC<ChatProps> = ({ socket, roomId, username }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleReceiveMessage(
      data: Omit<ChatMessage, "timestamp"> & { timestamp?: string | Date }
    ) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        },
      ]);
    }

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessageHandler() {
    if (messageInput.trim() === "") return;

    const timestamp = new Date();

    socket.emit("send-message", {
      roomId,
      message: messageInput,
      username,
      timestamp,
    });

    setMessages((prevMessages) => [
      ...prevMessages,
      { message: messageInput, username, timestamp },
    ]);

    setMessageInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessageHandler();
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        {isVisible ? (
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Box */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-gray-800 shadow-xl rounded-lg border border-gray-700 flex flex-col overflow-hidden z-40">
          <div className="bg-gray-700 text-white p-3 font-semibold text-sm">
            Chat - Room
          </div>

          <div className="flex-1 p-3 space-y-3 overflow-y-auto text-sm bg-gray-800">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No messages yet
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg w-fit max-w-[85%] ${
                    msg.username === username
                      ? "bg-blue-600 text-white ml-auto"
                      : "bg-gray-700 text-gray-200 mr-auto"
                  }`}
                >
                  <div className="flex justify-between text-xs mb-1 gap-3">
                    <span className="font-medium">{msg.username}</span>
                    <span className="opacity-70">
                      {formatTime(
                        msg.timestamp instanceof Date
                          ? msg.timestamp
                          : new Date(msg.timestamp)
                      )}
                    </span>
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-l-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
