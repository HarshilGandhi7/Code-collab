"use client";
import { useParams } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import ConnectedUsers from "@/app/(components)/ConnectedUsers";
import Chat from "@/app/(components)/Chat";
import AiChat from "@/app/(components)/AiChat";

const defaultCode = "";

interface LanguageOption {
  id: number;
  name: string;
}

type LanguageMap = {
  [key: string]: LanguageOption;
  javascript: LanguageOption;
  typescript: LanguageOption;
  python: LanguageOption;
  java: LanguageOption;
  cpp: LanguageOption;
  c: LanguageOption;
  go: LanguageOption;
  rust: LanguageOption;
  ruby: LanguageOption;
  php: LanguageOption;
  csharp: LanguageOption;
  kotlin: LanguageOption;
  swift: LanguageOption;
};

const languageMap: LanguageMap = {
  javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  typescript: { id: 74, name: "TypeScript (3.7.4)" },
  python: { id: 71, name: "Python (3.8.1)" },
  java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
  cpp: { id: 54, name: "C++ (GCC 9.2.0)" },
  c: { id: 50, name: "C (GCC 9.2.0)" },
  go: { id: 60, name: "Go (1.13.5)" },
  rust: { id: 73, name: "Rust (1.40.0)" },
  ruby: { id: 72, name: "Ruby (2.7.0)" },
  php: { id: 68, name: "PHP (7.4.1)" },
  csharp: { id: 51, name: "C# (Mono 6.6.0.161)" },
  kotlin: { id: 78, name: "Kotlin (1.3.70)" },
  swift: { id: 83, name: "Swift (5.2.3)" },
};

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;
  const username = params.username as string;

  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [users, setUsers] = useState<Array<string>>([]);
  const editorRef = useRef(null);
  const [cursors, setCursors] = useState<{
    [key: string]: { line: number; column: number };
  }>({});
  const [userInput, setUserInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const JUDGE0_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY || "";
  const JUDGE0_API_URL =
    process.env.NEXT_PUBLIC_JUDGE0_API_URL ||
    "https://judge0-ce.p.rapidapi.com";

  useEffect(() => {
    if (socket.connected) {
      socket.emit("join-room", { roomId, username }, () => {});
    }
    socket.on("connect", () => {
      socket.emit("join-room", { roomId, username }, () => {
        console.log("User joining room from client - CALLBACK EXECUTED");
      });
    });

    socket.on("user-joined", (data) => {
      setLanguage(data.language);
      setCode(data.code);
      if (data.username !== username) {
        toast.success(`${data.username} joined the room!`);
      }
    });

    socket.on("room-users", (users: Array<string>) => {
      setUsers(users);

      setCursors((prev) => {
        const updatedCursors: {
          [key: string]: { line: number; column: number };
        } = {};
        Object.keys(prev).forEach((cursorUser) => {
          if (users.includes(cursorUser) || cursorUser === username) {
            updatedCursors[cursorUser] = prev[cursorUser];
          }
        });
        return updatedCursors;
      });
    });

    socket.on("user-left", (data) => {
      if (data.username !== username) {
        toast.error(`${data.username} left the room!`);

        setCursors((prev) => {
          const updatedCursors = { ...prev };
          delete updatedCursors[data.username];
          return updatedCursors;
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("language-update", (data) => {
      setLanguage(data.language);
    });

    socket.on("code-update", (data) => {
      setCode(data.code);
    });

    socket.on("cursor-update", (data) => {
      if (data.username !== username) {
        setCursors((prev) => ({
          ...prev,
          [data.username]: { line: data.line, column: data.column },
        }));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("user-left");
      socket.off("join-room");
      socket.off("language-update");
      socket.off("user-joined");
      socket.off("room-users");
      socket.off("disconnect");
      socket.off("cursor-update");
      socket.off("code-update");
    };
  }, [username, roomId]);

  function downloadCodeAsFile() {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });

    const url = URL.createObjectURL(blob);

    const filename = `${roomId}_${language}_code.${getFileExtension(language)}`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function getFileExtension(language: string): string {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rust: "rs",
      ruby: "rb",
      php: "php",
      csharp: "cs",
      kotlin: "kt",
      swift: "swift",
    };

    return extensions[language] || "txt";
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLanguage = e.target.value;
    if (language === newLanguage) return;

    setPendingLanguage(newLanguage);
    setShowModal(true);
  }

  function confirmLanguageChange() {
    if (pendingLanguage) {
      setLanguage(pendingLanguage);
      socket.emit("language-update", { roomId, language: pendingLanguage });

      setCode("");
      socket.emit("code-update", { roomId, code: "" });
    }
    setShowModal(false);
  }

  function cancelLanguageChange() {
    setPendingLanguage(null);
    setShowModal(false);
  }

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e: any) => {
      if (editor.hasTextFocus()) {
        socket.emit("cursor-update", {
          roomId,
          username,
          line: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });
  }

  function handleEditorChange(value: string | undefined) {
    setCode(value || "");
    socket.emit("code-update", { roomId, code: value });
  }

  async function executeCode() {
    setIsRunning(true);
    setOutput("");
    setStatusMessage("Executing code...");

    try {
      const response = await axios.post(
        `${JUDGE0_API_URL}/submissions`,
        {
          source_code: btoa(code),
          language_id: languageMap[language].id,
          stdin: btoa(userInput),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
          params: {
            base64_encoded: "true",
          },
        }
      );

      const { token } = response.data;

      if (!token) {
        throw new Error("No token received from Judge0 API");
      }

      setStatusMessage("Code is compiling...");

      let intervalId = setInterval(async () => {
        try {
          const result = await axios.get(
            `${JUDGE0_API_URL}/submissions/${token}`,
            {
              headers: {
                "X-RapidAPI-Key": JUDGE0_API_KEY,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              },
              params: {
                base64_encoded: "true",
                fields:
                  "stdout,stderr,status,compile_output,message,time,memory",
              },
            }
          );

          const { status, stdout, stderr, compile_output, message } =
            result.data;

          if (status.id >= 3) {
            clearInterval(intervalId);

            let outputText = "";
            if (stdout) outputText += base64ToString(stdout);
            if (stderr) outputText += `\nError: ${base64ToString(stderr)}`;
            if (compile_output)
              outputText += `\nCompiler Output: ${base64ToString(
                compile_output
              )}`;
            if (message) outputText += `\nMessage: ${base64ToString(message)}`;

            setOutput(outputText || "No output");
            setStatusMessage("");
            setIsRunning(false);
          }
        } catch (error: any) {
          clearInterval(intervalId);
          setOutput(`Error fetching results: ${error.message}`);
          setStatusMessage("");
          setIsRunning(false);
        }
      }, 1000);
    } catch (error: any) {
      setOutput(`Error submitting code: ${error.message}`);
      setStatusMessage("");
      setIsRunning(false);
    }
  }

  function base64ToString(str: string) {
    try {
      return str ? atob(str) : "";
    } catch (e) {
      console.error("Base64 decoding error:", e);
      return "Error decoding output";
    }
  }

  function getUserColor(username: string, opacity = 0.3) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 90;
    const lightness = 75;

    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Code Collaboration Room</h1>
            <p className="text-gray-400">Room ID: {roomId}</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectedUsers users={users} currentUser={username} />
          </div>
        </header>

        <div className="flex gap-4 mb-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700"
          >
            {Object.entries(languageMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>

          <button
            onClick={executeCode}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
          <button
            onClick={downloadCodeAsFile}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download
          </button>
          <AiChat />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="h-[600px] w-full relative">
              <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={code}
                theme="vs-dark"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
              {Object.entries(cursors).map(([user, position]) => (
                <div
                  key={user}
                  className="absolute z-50 pointer-events-none"
                  style={{
                    left: `${position.column * 8}px`,
                    top: `${position.line * 18}px`,
                    color: getUserColor(user),
                  }}
                >
                  <div
                    style={{
                      borderLeft: `2px solid ${getUserColor(user)}`,
                      height: "18px",
                      position: "relative",
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: getUserColor(user),
                      color: "white",
                      fontSize: "10px",
                      padding: "2px 4px",
                      borderRadius: "2px",
                      whiteSpace: "nowrap",
                      position: "absolute",
                      top: "0px",
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {user}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* User input section */}
            <div className="p-3 bg-gray-700 border-t border-gray-600">
              <label
                htmlFor="userInput"
                className="block text-sm font-medium mb-1"
              >
                Program Input (stdin)
              </label>
              <textarea
                id="userInput"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter input for your program here..."
                className="w-full bg-gray-800 text-white p-2 rounded font-mono text-sm resize-none h-20"
              />
            </div>
            <div className="pl-3 bg-gray-700 text-sm font-semibold flex justify-between">
              <span className="block text-sm font-medium mb-1">Output</span>
              {statusMessage && (
                <span className="text-yellow-400">{statusMessage}</span>
              )}
            </div>

            <div className="p-4 h-[460px] overflow-auto font-mono text-sm whitespace-pre-wrap">
              {output || "Run your code to see output here"}
            </div>
          </div>
        </div>

        <AiChat />

        <Chat socket={socket} roomId={roomId} username={username} />
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 bg-opacity-95 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-700 transform transition-all duration-300 scale-100">
            <div className="flex items-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-xl font-bold text-red-400">Warning</h3>
            </div>

            <p className="mb-6 text-gray-300 leading-relaxed">
              Changing the programming language will delete the current code in
              the editor.
              <span className="block mt-2 font-semibold text-red-300">
                This action cannot be undone.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelLanguageChange}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLanguageChange}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Change Language
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
