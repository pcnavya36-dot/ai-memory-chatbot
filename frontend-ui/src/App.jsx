import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Brain,
  Settings,
  Moon,
  Sun,
  Send,
  Mic,
  Paperclip,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Volume2,
  MessageSquare,
  Sparkles,
  Code2,
  BookOpen,
  Lightbulb,
  X,
  Lock,
  Pin,
  Pencil,
  Trash2,
  LogOut,
  User,
  Check,
} from "lucide-react";

import "./App.css";


const initialChats = [
  {
    id: 1,
    title: "AI Project Discussion",
    time: "Today",
    pinned: true,
  },
  {
    id: 2,
    title: "Python Programming",
    time: "Today",
    pinned: false,
  },
  {
    id: 3,
    title: "Database Concepts",
    time: "Yesterday",
    pinned: false,
  },
];


const suggestions = [
  {
    icon: BookOpen,
    title: "Study with me",
    text: "Help me understand a difficult topic",
  },
  {
    icon: Code2,
    title: "Help me code",
    text: "Explain or improve my code",
  },
  {
    icon: Lightbulb,
    title: "Develop an idea",
    text: "Turn my idea into a project",
  },
];


const modes = [
  "Normal",
  "Study",
  "Coding",
  "Creative",
];


function App() {

  const [darkMode, setDarkMode] = useState(false);

  const [memoryOn, setMemoryOn] = useState(true);

  const [privateMode, setPrivateMode] = useState(false);
  const [privateUnlocked, setPrivateUnlocked] = useState(false);

  const [showPrivateLock, setShowPrivateLock] = useState(false);

  const [privatePin, setPrivatePin] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  const [chats, setChats] = useState(initialChats);

  const [activeChat, setActiveChat] = useState(() => {
    const savedChat = localStorage.getItem("activeChat");

    return savedChat
      ? Number(savedChat)
      : 1;
  });

  const [search, setSearch] = useState("");

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [showMemory, setShowMemory] = useState(false);

  const [showSettings, setShowSettings] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [showAuth, setShowAuth] = useState(false);

  const [showChatMenu, setShowChatMenu] = useState(null);

  const [editingChat, setEditingChat] = useState(null);

  const [editTitle, setEditTitle] = useState("");

  const [aiMode, setAiMode] = useState("Normal");

  const [loggedIn, setLoggedIn] = useState(
    () => localStorage.getItem("loggedIn") === "true"
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || ""
  );

  const [userId, setUserId] = useState(
    () => {
      const savedUserId =
        localStorage.getItem("userId");

      return savedUserId
        ? Number(savedUserId)
        : null;
    }
  );
  const [authMode, setAuthMode] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [copiedId, setCopiedId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const token = params.get("token");

    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
      setShowAuth(false);
      setShowForgotPassword(false);
    }
  }, []);

  /* ================================
   LOAD SAVED CHATS
================================= */

  useEffect(() => {
    const loadChats = async () => {
      try {
        setIsThinking(true);
        const response = await fetch(
          `https://ai-memory-chatbot.onrender.com/chats?user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load chats");
        }

        const data = await response.json();


        if (data.length > 0) {
          const savedChats = data.map((chat) => ({
            id: chat.id,
            title: chat.title,
            time: "Today",
            pinned: chat.pinned,
            isPrivate: chat.is_private,
          }));

          setChats(savedChats);
        }
      } catch (error) {
        console.error("Failed to load chats:", error);
      }
      finally {
        setIsThinking(false);
      }
    };

    if (userId) {
      loadChats();
    }

  }, [userId]);
  /* ================================
   LOAD SAVED MESSAGES
================================= */

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `https://ai-memory-chatbot.onrender.com/messages?chat_id=${activeChat}&user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();

        const savedMessages = data.map((item, index) => ({
          id: index + 1,
          role: item.role,
          text: item.message,
          time: "",
        }));

        setMessages(savedMessages);
      } catch (error) {
        console.error(
          "Failed to load saved messages:",
          error
        );
      }
    };

    if (activeChat && userId) {
      loadMessages();
    } else {
      setMessages([]);
    }

  }, [activeChat, userId]);

  const handleForgotPassword = async () => {
    if (!authEmail.trim()) {
      alert("Enter your email address");
      return;
    }

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: authEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
          "Unable to process password reset request"
        );
        return;
      }

      alert(
        data.message ||
        "If an account exists, a password reset link has been sent."
      );

      setShowForgotPassword(false);
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      alert("Could not connect to backend");
    }
  };
  const handleResetPassword = async () => {
    if (!resetToken) {
      alert("Invalid or missing reset link");
      return;
    }

    if (!newPassword.trim()) {
      alert("Enter your new password");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetToken,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
          "Unable to reset password"
        );
        return;
      }

      alert("Password reset successful. Please login.");

      setNewPassword("");
      setResetToken("");
      setShowResetPassword(false);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setAuthMode("login");
      setShowAuth(true);

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      alert("Could not connect to backend");
    }
  };
  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword) {
      alert("Enter email and password");
      return;
    }

    if (authMode === "signup" && !authName.trim()) {
      alert("Enter your name");
      return;
    }

    try {
      const endpoint =
        authMode === "login"
          ? "login"
          : "signup";

      const body =
        authMode === "signup"
          ? {
            name: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }
          : {
            email: authEmail.trim(),
            password: authPassword,
          };

      const response = await fetch(
        `https://ai-memory-chatbot.onrender.com/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Authentication failed");
        return;
      }


      setLoggedIn(true);
      setUserName(data.user.name);
      setUserId(data.user.id);
      setChats([]);
      setMessages([]);
      setActiveChat(null);
      localStorage.removeItem("activeChat");
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem(
        "userId",
        String(data.user.id)
      );
      setShowAuth(false);

      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");

      alert(data.message);

    } catch (error) {
      console.error("Authentication error:", error);
      alert("Could not connect to backend");
    }
  };


  /* ================================
     SEND MESSAGE
  ================================= */

  const sendMessage = async () => {
    const text = message.trim();

    if (!text) return;
    // Automatically rename a new conversation
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat &&
          chat.title === "New conversation"
          ? {
            ...chat,
            title:
              text.length > 30
                ? text.slice(0, 30) + "..."
                : text,
          }
          : chat
      )
    );
    const currentChat = chats.find(
      (chat) => chat.id === activeChat
    );

    if (
      currentChat &&
      currentChat.title === "New conversation"

    ) {
      const newTitle =
        text.length > 30
          ? text.slice(0, 30) + "..."
          : text;

      try {
        await fetch(
          "https://ai-memory-chatbot.onrender.com/chats",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: activeChat,
              title: newTitle,
              user_id: userId,
            }),
          }
        );
      } catch (error) {
        console.error(
          "Failed to save chat title:",
          error
        );
      }
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Show user's message immediately
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    setMessage("");
    setIsThinking(true);

    try {
      // Send message to Flask backend
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            memory_enabled: memoryOn,
            chat_id: activeChat,
            private_mode: privateMode,
            user_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Backend error"
        );
      }

      // Real AI response
      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.reply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);

      // Rename new conversation
      const currentChat = chats.find(
        (chat) => chat.id === activeChat
      );

      if (
        currentChat &&
        currentChat.title === "New conversation"
      ) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat
              ? {
                ...chat,
                title:
                  text.length > 28
                    ? text.slice(0, 28) + "..."
                    : text,
              }
              : chat
          )
        );
      }

    } catch (error) {
      console.error("Backend connection error:", error);

      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text:
          "Sorry, I couldn't connect to the backend. Please make sure the Flask server is running.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  /* ================================
     CLEAR MEMORY
  ================================= */

  const clearMemory = async () => {
    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/messages",
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to clear memory"
        );
      }

      // Clear messages from frontend also
      setMessages([]);

      // Close memory popup
      setShowMemory(false);

      alert("Memory cleared successfully!");

    } catch (error) {
      console.error(
        "Clear memory error:",
        error
      );

      alert(
        "Could not clear memory. Make sure backend is running."
      );
    }
  };

  /* ================================
     NEW CHAT
  ================================= */

  const newChat = async () => {

    const id = Date.now();

    const newConversation = {
      id: id,
      title: "New conversation",
      time: "Today",
      pinned: false,
    };
    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/chats",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            title: "New conversation",
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save new chat");
      }
    } catch (error) {
      console.error("Failed to save new chat:", error);
      return;
    }

    setChats((prev) => [
      newConversation,
      ...prev,
    ]);

    setActiveChat(id);

    setMessages([]);

    setPrivateMode(false);

    setShowMoreMenu(false);

    setShowChatMenu(null);
  };


  /* ================================
     SELECT CHAT
  ================================= */

  const selectChat = (id) => {
    localStorage.setItem("activeChat", id);
    const selectedChat = chats.find(
      (chat) => chat.id === id
    );

    setActiveChat(id);

    setPrivateMode(
      selectedChat?.isPrivate || false
    );

    setShowChatMenu(null);
  };
  /* ================================
     DELETE CHAT
  ================================= */

  const deleteChat = async (id) => {
    try {
      const response = await fetch(
        `https://ai-memory-chatbot.onrender.com/messages/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      return;
    }

    const remaining = chats.filter(
      (chat) => chat.id !== id
    );

    // existing code continues...
    // existing code continues...



    setShowChatMenu(null);

    if (remaining.length === 0) {

      const newId = Date.now();

      const newConversation = {
        id: newId,
        title: "New conversation",
        time: "Today",
        pinned: false,
      };

      setChats([newConversation]);

      setActiveChat(newId);

      setMessages([]);

      return;
    }

    setChats(remaining);

    if (activeChat === id) {

      setActiveChat(remaining[0].id);

      setMessages([]);
    }
  };


  /* ================================
     RENAME CHAT
  ================================= */

  const renameChat = (chat) => {

    setEditingChat(chat.id);

    setEditTitle(chat.title);

    setShowChatMenu(null);
  };


  const saveRename = async (id) => {
    const newTitle = editTitle.trim();

    if (!newTitle) return;

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/chats",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            title: newTitle,
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save renamed chat");
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === id
            ? {
              ...chat,
              title: newTitle,
            }
            : chat
        )
      );

      setEditingChat(null);
      setEditTitle("");
    } catch (error) {
      console.error(
        "Failed to rename chat:",
        error
      );
    }
  };


  /* ================================
     PIN CHAT
  ================================= */

  const togglePin = async (id) => {
    const currentChat = chats.find(
      (chat) => chat.id === id
    );

    if (!currentChat) return;

    const newPinned = !currentChat.pinned;

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/chats",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: currentChat.id,
            title: currentChat.title,
            pinned: newPinned,
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save pin status"
        );
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === id
            ? {
              ...chat,
              pinned: newPinned,
            }
            : chat
        )
      );

      setShowChatMenu(null);
    } catch (error) {
      console.error(
        "Failed to update pin status:",
        error
      );
    }
  };
  const togglePrivate = async () => {
    const currentChat = chats.find(
      (chat) => chat.id === activeChat
    );

    if (!currentChat) return;

    const newPrivate = !privateMode;

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/chats",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: currentChat.id,
            title: currentChat.title,
            is_private: newPrivate,
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save private status"
        );
      }

      setPrivateMode(newPrivate);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat
            ? {
              ...chat,
              isPrivate: newPrivate,
            }
            : chat
        )
      );

      setShowMoreMenu(false);
    } catch (error) {
      console.error(
        "Failed to update private status:",
        error
      );
    }
  };

  const unlockPrivateChats = async () => {
    const pin = privatePin.trim();

    if (!pin) {
      alert("Enter your private PIN");
      return;
    }

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/private-pin/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin: pin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Incorrect PIN");
        return;
      }

      setPrivateUnlocked(true);
      setShowPrivateLock(false);
      setPrivatePin("");

    } catch (error) {
      console.error(
        "Private PIN verification error:",
        error
      );

      alert("Could not verify PIN");
    }
  };
  const setupPrivatePin = async () => {
    const pin = privatePin.trim();

    if (
      !/^\d{4,8}$/.test(pin)
    ) {
      alert("PIN must contain 4 to 8 digits");
      return;
    }

    try {
      const response = await fetch(
        "https://ai-memory-chatbot.onrender.com/private-pin/setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin: pin,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
          "Could not create private PIN"
        );
        return;
      }

      setPrivateUnlocked(true);
      setShowPrivateLock(false);
      setPrivatePin("");

      alert("Private PIN created successfully");

    } catch (error) {
      console.error(
        "Private PIN setup error:",
        error
      );

      alert("Could not create private PIN");
    }
  };


  /* ================================
     COPY MESSAGE
  ================================= */

  const copyMessage = async (text, id) => {

    try {

      await navigator.clipboard.writeText(text);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 1200);

    } catch {

      console.log("Copy failed");

    }
  };


  /* ================================
     READ ALOUD
  ================================= */

  const readAloud = (text) => {

    if ("speechSynthesis" in window) {

      window.speechSynthesis.cancel();

      const speech =
        new SpeechSynthesisUtterance(text);

      window.speechSynthesis.speak(speech);
    }
  };


  /* ================================
     CHAT SEARCH
  ================================= */

  const filteredChats = chats
    .filter(
      (chat) =>
        !chat.isPrivate &&
        chat.title
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned)
    );

  const privateChats = chats
    .filter(
      (chat) =>
        chat.isPrivate &&
        chat.title
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned)
    );


  /* ================================
     LOGOUT
  ================================= */

  const logout = () => {

    setLoggedIn(false);

    setShowProfile(false);
  };


  return (
    <div
      className={
        darkMode
          ? "app dark"
          : "app"
      }
    >

      {/* =================================
          SIDEBAR
      ================================= */}

      <aside
        className={
          `sidebar ${sidebarOpen
            ? "open"
            : "closed"
          }`
        }
      >

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            <Sparkles size={19} />
          </div>

          {sidebarOpen && (
            <div className="brand-text">

              <h2>MemoryAI</h2>

              <span>
                Personal AI Assistant
              </span>

            </div>
          )}

          {sidebarOpen && (
            <button
              className="mobile-close"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <X size={18} />
            </button>
          )}

        </div>


        {/* NEW CONVERSATION */}

        <button
          className="new-chat"
          onClick={newChat}
          style={{
            background:
              "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "11px 14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow:
              "0 6px 18px rgba(139, 92, 246, 0.25)",
            transition: "all 0.25s ease",
          }}
        >

          <Plus size={18} />

          {sidebarOpen && (
            <span>
              New conversation
            </span>
          )}

        </button>


        {/* SEARCH AND CHAT HISTORY */}

        {sidebarOpen && (
          <>

            <div className="search-box">

              <Search size={16} />

              <input
                type="text"
                placeholder="Search conversations"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            <div className="chat-section">

              <p className="section-title">
                CHAT HISTORY
              </p>


              {filteredChats.map((chat) => (

                <div
                  className={
                    `chat-item-wrapper ${activeChat === chat.id
                      ? "active"
                      : ""
                    }`
                  }
                  key={chat.id}
                >

                  {/* RENAME */}

                  {editingChat === chat.id ? (

                    <div className="rename-box">

                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) =>
                          setEditTitle(
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {

                          if (
                            e.key === "Enter"
                          ) {
                            saveRename(
                              chat.id
                            );
                          }

                          if (
                            e.key === "Escape"
                          ) {
                            setEditingChat(
                              null
                            );
                          }

                        }}
                      />

                      <button
                        onClick={() =>
                          saveRename(
                            chat.id
                          )
                        }
                      >
                        <Check size={14} />
                      </button>

                    </div>

                  ) : (

                    <div className="chat-item-row">

                      {/* CHAT TITLE */}

                      <button
                        className="chat-item"
                        onClick={() =>
                          selectChat(
                            chat.id
                          )
                        }
                      >

                        <MessageSquare
                          size={16}
                        />

                        <span>
                          {chat.title}
                        </span>

                        {chat.pinned && (
                          <Pin
                            size={11}
                            className="pinned-icon"
                          />
                        )}

                      </button>


                      {/* CHAT THREE DOT */}

                      <button
                        className="chat-menu-button"
                        onClick={(e) => {

                          e.stopPropagation();

                          setShowChatMenu(
                            showChatMenu ===
                              chat.id
                              ? null
                              : chat.id
                          );

                        }}
                      >

                        <MoreHorizontal
                          size={16}
                        />

                      </button>


                      {/* CHAT MENU */}

                      {showChatMenu ===
                        chat.id && (

                          <div className="chat-menu">

                            <button
                              onClick={() =>
                                renameChat(
                                  chat
                                )
                              }
                            >

                              <Pencil
                                size={14}
                              />

                              Rename

                            </button>


                            <button
                              onClick={() =>
                                togglePin(
                                  chat.id
                                )
                              }
                            >

                              <Pin
                                size={14}
                              />

                              {chat.pinned
                                ? "Unpin"
                                : "Pin"}

                            </button>


                            <button
                              className="delete-option"
                              onClick={() =>
                                deleteChat(
                                  chat.id
                                )
                              }
                            >

                              <Trash2
                                size={14}
                              />

                              Delete

                            </button>

                          </div>

                        )}

                    </div>

                  )}

                </div>

              ))}

            </div>
            <div className="chat-section">

              <button
                className="section-title"
                onClick={() => setShowPrivateLock(true)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background:
                    "linear-gradient(135deg, #06b6d4, #6366f1, #a855f7)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "14px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  boxShadow:
                    "0 6px 18px rgba(99, 102, 241, 0.25)",
                }}
              >
                🔒 PRIVATE CHATS
              </button>

              {!privateUnlocked ? (
                <p className="section-title">
                  Click Private Chats to unlock
                </p>
              ) : privateChats.length === 0 ? (
                <p className="section-title">
                  No private chats
                </p>
              ) : (
                privateChats.map((chat) => (
                  <button
                    key={chat.id}
                    className={
                      `chat-item ${activeChat === chat.id
                        ? "active"
                        : ""
                      }`
                    }
                    onClick={() =>
                      selectChat(chat.id)
                    }
                  >
                    <Lock size={16} />

                    <span>
                      {chat.title}
                    </span>

                    {chat.pinned && (
                      <Pin
                        size={11}
                        className="pinned-icon"
                      />
                    )}
                  </button>
                ))
              )}

            </div>

          </>
        )}


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          {/* MEMORY ONLY */}

          <button
            className="side-action"
            onClick={() =>
              setShowMemory(true)
            }
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              background: "rgba(139, 92, 246, 0.08)",
              color: "inherit",
              transition: "all 0.25s ease",
            }}
          >

            <Brain size={18} />

            {sidebarOpen && (
              <span>
                Memory
              </span>
            )}

          </button>

        </div>

      </aside>


      {/* =================================
          MAIN
      ================================= */}

      <main className="main">


        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            <MoreHorizontal size={21} />
          </button>


          <div className="top-title">

            <h3>
              AI Assistant
            </h3>

            <span>
              Personalized conversations
            </span>

          </div>


          <div className="top-actions">

            {/* MEMORY STATUS */}

            <div
              className={
                `status-dot ${memoryOn
                  ? "active"
                  : ""
                }`
              }
              title={
                memoryOn
                  ? "Memory enabled"
                  : "Memory disabled"
              }
            />


            {/* TOP RIGHT THREE DOT */}

            <div className="more-wrapper">

              <button
                className="icon-button"
                onClick={() =>
                  setShowMoreMenu(
                    !showMoreMenu
                  )
                }
              >

                <MoreHorizontal
                  size={19}
                />

              </button>


              {showMoreMenu && (

                <div className="top-menu">

                  {/* CHAT OPTIONS */}

                  <p className="menu-heading">
                    CHAT OPTIONS
                  </p>


                  <button
                    onClick={togglePrivate}
                  >

                    <Lock size={15} />

                    <span>
                      Private conversation
                    </span>

                    {privateMode && (
                      <Check
                        size={14}
                        className="menu-check"
                      />
                    )}

                  </button>


                  <button
                    onClick={() => {

                      setShowMemory(true);

                      setShowMoreMenu(
                        false
                      );

                    }}
                  >

                    <Brain size={15} />

                    <span>
                      Memory
                    </span>

                  </button>


                  {/* SETTINGS */}

                  <button
                    onClick={() => {

                      setShowSettings(true);

                      setShowMoreMenu(
                        false
                      );

                    }}
                  >

                    <Settings size={15} />

                    <span>
                      Settings
                    </span>

                  </button>


                  <div className="menu-divider" />


                  {/* AI MODE */}

                  <p className="menu-heading">
                    AI MODE
                  </p>


                  {modes.map((mode) => (

                    <button
                      key={mode}
                      onClick={() => {

                        setAiMode(mode);

                        setShowMoreMenu(
                          false
                        );

                      }}
                    >

                      <Sparkles
                        size={14}
                      />

                      <span>
                        {mode}
                      </span>

                      {aiMode === mode && (
                        <Check
                          size={14}
                          className="menu-check"
                        />
                      )}

                    </button>

                  ))}


                  <div className="menu-divider" />


                  {/* APPEARANCE */}

                  <p className="menu-heading">
                    APPEARANCE
                  </p>


                  <button
                    onClick={() =>
                      setDarkMode(
                        !darkMode
                      )
                    }
                  >

                    {darkMode ? (
                      <Sun size={15} />
                    ) : (
                      <Moon size={15} />
                    )}

                    <span>
                      {darkMode
                        ? "Light mode"
                        : "Dark mode"}
                    </span>

                    <Check
                      size={14}
                      className="menu-check"
                    />

                  </button>

                </div>

              )}

            </div>


            {/* =================================
                PROFILE - TOP RIGHT ONLY
            ================================= */}

            <button
              className="profile-top-button"
              onClick={() =>
                setShowProfile(
                  !showProfile
                )
              }
            >

              <User size={16} />

            </button>

          </div>

        </header>


        {/* =================================
            CHAT AREA
        ================================= */}

        <section className="chat-area">

          {messages.length === 0 ? (

            <div className="welcome">

              <div className="welcome-icon">
                <Sparkles size={28} />
              </div>


              <p className="welcome-label">
                WELCOME TO MEMORYAI
              </p>


              <h1>

                Your conversations,

                <br />

                <span>
                  remembered.
                </span>

              </h1>


              <p className="welcome-text">

                A personal AI assistant that
                understands your context,
                remembers useful information
                and grows with every
                conversation.

              </p>


              <div className="suggestions">

                {suggestions.map(
                  (item, index) => {

                    const Icon =
                      item.icon;

                    return (

                      <button
                        className="suggestion-card"
                        key={index}
                        onClick={() =>
                          setMessage(
                            item.text
                          )
                        }
                      >

                        <div className="suggestion-icon">

                          <Icon size={18} />

                        </div>


                        <div>

                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            {item.text}
                          </span>

                        </div>

                      </button>

                    );

                  }
                )}

              </div>

            </div>

          ) : (

            <div className="messages">

              {messages.map((msg) => (

                <div
                  className={
                    `message-row ${msg.role === "user"
                      ? "user-row"
                      : ""
                    }`
                  }
                  key={msg.id}
                >

                  <div
                    className={
                      `avatar ${msg.role ===
                        "assistant"
                        ? "ai-avatar"
                        : "user-avatar"
                      }`
                    }
                  >

                    {msg.role ===
                      "assistant" ? (
                      <Sparkles size={16} />
                    ) : (
                      "D"
                    )}

                  </div>


                  <div className="message-content">

                    <div className="message-name">

                      {msg.role ===
                        "assistant"
                        ? "MemoryAI"
                        : "You"}

                      <span className="message-time">
                        {msg.time}
                      </span>

                    </div>


                    <div className="message-bubble">
                      {msg.text}
                    </div>


                    {msg.role ===
                      "assistant" && (

                        <div className="message-tools">

                          <button
                            onClick={() =>
                              copyMessage(
                                msg.text,
                                msg.id
                              )
                            }
                          >

                            {copiedId ===
                              msg.id ? (
                              <Check
                                size={13}
                              />
                            ) : (
                              <Copy
                                size={13}
                              />
                            )}

                            {copiedId ===
                              msg.id
                              ? "Copied"
                              : "Copy"}

                          </button>


                          <button>

                            <RotateCcw
                              size={13}
                            />

                            Regenerate

                          </button>


                          <button
                            onClick={() =>
                              readAloud(
                                msg.text
                              )
                            }
                          >

                            <Volume2
                              size={13}
                            />

                            Read aloud

                          </button>

                        </div>

                      )}

                  </div>

                </div>

              ))}
              {isThinking && (
                <div className="message-row assistant">
                  <div className="message assistant-message">
                    <Sparkles size={16} />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}

            </div>

          )}

        </section>


        {/* =================================
            INPUT
        ================================= */}

        <div className="input-container">

          <div className="input-box">

            <button className="input-icon">

              <Paperclip size={18} />

            </button>


            <textarea
              placeholder={
                privateMode
                  ? "Private message..."
                  : "Message MemoryAI..."
              }
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {

                  e.preventDefault();

                  sendMessage();

                }

              }}
            />


            <button className="input-icon">

              <Mic size={18} />

            </button>


            <button
              className="send-button"
              onClick={sendMessage}
              style={{
                background:
                  "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                boxShadow:
                  "0 6px 18px rgba(139, 92, 246, 0.3)",
                transition: "all 0.25s ease",
              }}
            >

              <Send size={17} />

            </button>

          </div>


          <div className="input-footer">

            <span>

              {privateMode ? (
                <>
                  <Lock size={12} />
                  Private conversation
                </>
              ) : (
                <>
                  <Brain size={12} />
                  Memory enabled
                </>
              )}

            </span>


            <span>

              {aiMode} mode · Enter to send

            </span>

          </div>

        </div>

      </main>

      {/* =================================
    PRIVATE CHAT LOCK
================================= */}

      {showPrivateLock && (
        <div className="overlay">
          <div className="modal">

            <div className="modal-header">
              <div>
                <h2
                  style={{
                    color: "#1f2937",
                    fontWeight: "700",
                    fontSize: "28px",
                    marginBottom: "8px",
                  }}
                >
                  Private Chats
                </h2>

                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "16px",
                    fontWeight: "500",
                    marginTop: "0",
                  }}
                >
                  Enter your PIN to unlock private chats
                </p>
              </div>

              <button
                onClick={() => {
                  setShowPrivateLock(false);
                  setPrivatePin("");
                }}
              >
                <X size={19} />
              </button>
            </div>

            <input
              className="auth-input"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#f8fafc",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                color: "#1f2937",
                borderRadius: "12px",
                padding: "12px 14px",
                outline: "none",
                fontSize: "16px",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.08)",
              }}
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="Enter PIN"
              value={privatePin}
              onChange={(e) =>
                setPrivatePin(e.target.value)
              }
            />

            <button
              className="auth-submit"
              onClick={unlockPrivateChats}
              style={{
                width: "100%",
                padding: "12px 16px",
                background:
                  "linear-gradient(135deg, #06b6d4, #6366f1, #a855f7)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow:
                  "0 6px 20px rgba(99, 102, 241, 0.35)",
              }}
            >
              <Lock size={16} />
              Unlock Private Chats
            </button>
            <button
              type="button"
              onClick={setupPrivatePin}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "11px 14px",
                background: "rgba(99, 102, 241, 0.08)",
                color: "#4f46e5",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              First time? Create Private PIN
            </button>
          </div>
        </div>
      )}


      {/* =================================
          PROFILE MENU
      ================================= */}

      {showProfile && (
        <div className="profile-menu">

          <div className="profile-menu-header">
            <div className="large-profile-avatar">
              <User size={18} />
            </div>

            <div>
              <strong>
                {loggedIn ? userName : "Guest Mode"}
              </strong>

              <span>
                {loggedIn
                  ? "Personal account"
                  : "You are not signed in"}
              </span>
            </div>
          </div>

          <div className="profile-divider" />

          {/* 1. Guest Mode */}
          <button
            className="profile-option"
            onClick={() => {
              setLoggedIn(false);
              setUserId(null);
              setChats([]);
              localStorage.removeItem("loggedIn");
              localStorage.removeItem("userName");
              localStorage.removeItem("userId");
              setShowProfile(false);
            }}
          >
            <User size={15} />
            <span>Guest Mode</span>
          </button>

          {/* 2. Sign In */}
          {!loggedIn && (
            <button
              className="profile-option"
              onClick={() => {
                setAuthMode("login");
                setShowAuth(true);
                setShowProfile(false);
              }}
            >
              <LogOut size={15} />
              <span>Sign in</span>
            </button>
          )}

          {/* 3. Sign Out */}
          {loggedIn && (
            <button
              className="profile-option"
              onClick={() => {
                setLoggedIn(false);
                setShowProfile(false);
              }}
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          )}

          {/* 4. Switch Account */}
          <button
            className="profile-option"
            onClick={() => {
              setLoggedIn(false);
              setAuthMode("login");
              setShowAuth(true);
              setShowProfile(false);
            }}
          >
            <User size={15} />
            <span>Switch to another account</span>
          </button>

        </div>
      )}

      {/* =================================
          MEMORY MODAL
      ================================= */}

      {showMemory && (

        <div className="overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  Memory
                </h2>

                <p>
                  Manage what MemoryAI remembers
                </p>

              </div>


              <button
                onClick={() =>
                  setShowMemory(false)
                }
              >

                <X size={19} />

              </button>

            </div>


            <div className="memory-card">

              <div className="memory-card-icon">

                <Brain size={20} />

              </div>


              <div>

                <strong>
                  Long-term memory
                </strong>

                <p>
                  Use memory to personalize
                  future conversations.
                </p>

              </div>


              <label className="switch">

                <input
                  type="checkbox"
                  checked={memoryOn}
                  onChange={() =>
                    setMemoryOn(
                      !memoryOn
                    )
                  }
                />

                <span></span>

              </label>

            </div>


            <div className="saved-memory">

              <p className="section-title">
                SAVED INFORMATION
              </p>

              <div className="memory-item">

                <span>
                  📚
                </span>

                <div>
                  <strong>
                    Learning preferences
                  </strong>

                  <p>
                    Prefers simple explanations
                  </p>
                </div>

                <button>
                  <Trash2 size={15} />
                </button>

              </div>


              <div className="memory-item">

                <span>
                  💻
                </span>

                <div>
                  <strong>
                    Programming
                  </strong>

                  <p>
                    Interested in Python and
                    AI projects
                  </p>
                </div>

                <button>
                  <Trash2 size={15} />
                </button>

              </div>


              <button
                className="clear-memory-button"
                onClick={clearMemory}
              >
                <Trash2 size={16} />
                Clear all memory
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================
          SETTINGS MODAL
      ================================= */}

      {showSettings && (

        <div className="overlay">

          <div className="modal settings-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Settings
                </h2>

                <p>
                  Customize your AI experience
                </p>

              </div>


              <button
                onClick={() =>
                  setShowSettings(false)
                }
              >

                <X size={19} />

              </button>

            </div>


            {/* MEMORY */}

            <div className="setting-row">

              <div>

                <strong>
                  Memory
                </strong>

                <p>
                  Allow AI to remember useful
                  information
                </p>

              </div>


              <label className="switch">

                <input
                  type="checkbox"
                  checked={memoryOn}
                  onChange={() =>
                    setMemoryOn(
                      !memoryOn
                    )
                  }
                />

                <span></span>

              </label>

            </div>


            {/* PRIVATE CONVERSATION */}

            <div className="setting-row">

              <div>

                <strong>
                  Private conversation
                </strong>

                <p>
                  Don't use this conversation
                  for long-term memory
                </p>

              </div>


              <label className="switch">

                <input
                  type="checkbox"
                  checked={privateMode}
                  onChange={togglePrivate}
                />

                <span></span>

              </label>

            </div>


            {/* APPEARANCE */}

            <div className="setting-row">

              <div>

                <strong>
                  Appearance
                </strong>

                <p>
                  Change application theme
                </p>

              </div>


              <button
                className="setting-button"
                onClick={() =>
                  setDarkMode(
                    !darkMode
                  )
                }
              >

                {darkMode
                  ? "Light"
                  : "Dark"}

              </button>

            </div>


            {/* AI MODE */}

            <div className="setting-row">

              <div>

                <strong>
                  AI Mode
                </strong>

                <p>
                  Choose how the assistant
                  responds
                </p>

              </div>


              <select
                className="mode-select"
                value={aiMode}
                onChange={(e) =>
                  setAiMode(
                    e.target.value
                  )
                }
              >

                {modes.map((mode) => (

                  <option
                    key={mode}
                    value={mode}
                  >
                    {mode}
                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>

      )}


      {/* =================================
          LOGIN / SIGN UP
      ================================= */}

      {showAuth && (

        <div className="overlay">

          <div
            className="modal auth-modal"
            style={{
              background:
                "linear-gradient(145deg, rgba(20, 18, 40, 0.96), rgba(12, 15, 32, 0.96))",
              border: "1px solid rgba(139, 92, 246, 0.28)",
              borderRadius: "22px",
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.35), 0 0 35px rgba(139, 92, 246, 0.12)",
              backdropFilter: "blur(18px)",
            }}
          >
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
            >
              <X size={17} />
            </button>


            <div className="auth-icon">

              <Sparkles size={23} />

            </div>


            <h2>

              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}

            </h2>


            <p className="auth-description"
              style={{
                color: "#ffffff",
                opacity: 0.9,
                fontWeight: "500",
              }}
            >

              {authMode === "login"
                ? "Sign in to continue your personalized AI experience."
                : "Create an account to keep your conversations and preferences."}

            </p>
            {authMode === "signup" && (
              <input
                className="auth-input"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(139,92,246,0.35)",
                  color: "var(--text-primary)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  outline: "none",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
                type="text"
                placeholder="Your name"

                value={authName}
                onChange={(e) =>
                  setAuthName(e.target.value)
                }
              />
            )}


            <input
              className="auth-input"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
                borderRadius: "12px",
                padding: "12px 14px",
                outline: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              }}
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) =>
                setAuthEmail(e.target.value)
              }
            />

            <input
              className="auth-input"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "var(--text-primary)",
                borderRadius: "12px",
                padding: "12px 14px",
                outline: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              }}
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) =>
                setAuthPassword(e.target.value)
              }
            />
            {authMode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setShowAuth(false);
                  setShowForgotPassword(true);
                }}
                style={{
                  marginTop: "8px",
                  marginBottom: "12px",
                  width: "100%",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  color: "white",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </button>
            )}

            <button
              className="auth-submit"
              onClick={handleAuth}
              style={{
                background:
                  "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "12px 16px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow:
                  "0 6px 18px rgba(139, 92, 246, 0.25)",
                transition: "all 0.25s ease",
                transform: "translateY(0)",
              }}
            >
              {authMode === "login"
                ? "Login"
                : "Create account"}

            </button>


            <button
              className="auth-switch"
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px 12px",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                borderRadius: "10px",
                background: "rgba(139, 92, 246, 0.08)",
                color: "#ffffff",
                fontWeight: "700",
                opacity: 1,

                cursor: "pointer",
              }}
              onClick={() =>
                setAuthMode(
                  authMode === "login"
                    ? "signup"
                    : "login"
                )
              }
            >

              {authMode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}

            </button>

          </div>

        </div>

      )}
      {showForgotPassword && (
        <div className="overlay">
          <div className="modal auth-modal">

            <button
              className="auth-close"
              onClick={() => setShowForgotPassword(false)}
            >
              <X size={17} />
            </button>

            <div className="auth-icon">
              <Sparkles size={23} />
            </div>

            <h2>Reset your password</h2>

            <p className="auth-description">
              Enter your email and we&apos;ll send you a secure
              password reset link.
            </p>

            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />

            <button
              className="auth-submit"
              type="button"
              onClick={handleForgotPassword}
              style={{
                background:
                  "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
                border: "none",
              }}
            >
              Send reset link
            </button>

            <button
              className="auth-switch"
              type="button"

              onClick={() => {
                setShowForgotPassword(false);
                setShowAuth(true);
              }}
            >
              Back to Login
            </button>

          </div>
        </div>
      )}
      {showResetPassword && (
        <div className="overlay">
          <div className="modal auth-modal">

            <button
              className="auth-close"
              onClick={() => setShowResetPassword(false)}
            >
              <X size={17} />
            </button>

            <div className="auth-icon">
              <Sparkles size={23} />
            </div>

            <h2>Set a new password</h2>

            <p className="auth-description">
              Enter a new password for your account.
            </p>

            <input
              className="auth-input"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
              className="auth-submit"
              type="button"
              onClick={handleResetPassword}
              style={{
                background:
                  "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
                border: "none",
              }}
            >
              Update password
            </button>

          </div>
        </div>
      )}

    </div>
  );
}


export default App;