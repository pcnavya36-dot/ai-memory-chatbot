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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [chats, setChats] = useState(initialChats);

  const [activeChat, setActiveChat] = useState(1);

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

  const [loggedIn, setLoggedIn] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [copiedId, setCopiedId] = useState(null);

  /* ================================
   LOAD SAVED CHATS
================================= */

useEffect(() => {
  const loadChats = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/chats"
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
          pinned: false,
        }));

        setChats(savedChats);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  loadChats();
}, []);
    /* ================================
     LOAD SAVED MESSAGES
  ================================= */

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/messages?chat_id=${activeChat}`
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

    loadMessages();
  }, [activeChat]);


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
      "http://127.0.0.1:5000/chats",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeChat,
          title: newTitle,
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

  try {
    // Send message to Flask backend
    const response = await fetch(
      "http://127.0.0.1:5000/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          memory_enabled: memoryOn,
          chat_id: activeChat,
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
  }
};

/* ================================
   CLEAR MEMORY
================================= */

const clearMemory = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:5000/messages",
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
    "http://127.0.0.1:5000/chats",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        title: "New conversation",
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

    setActiveChat(id);

    

    setShowChatMenu(null);
  };


  /* ================================
     DELETE CHAT
  ================================= */

  const deleteChat = async (id) => {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/messages/${id}`,
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


  const saveRename = (id) => {

    if (!editTitle.trim()) return;

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              title: editTitle.trim(),
            }
          : chat
      )
    );

    setEditingChat(null);

    setEditTitle("");
  };


  /* ================================
     PIN CHAT
  ================================= */

  const togglePin = (id) => {

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              pinned: !chat.pinned,
            }
          : chat
      )
    );

    setShowChatMenu(null);
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
    .filter((chat) =>
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
          `sidebar ${
            sidebarOpen
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
                    `chat-item-wrapper ${
                      activeChat === chat.id
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
                `status-dot ${
                  memoryOn
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
                    onClick={() => {

                      setPrivateMode(
                        !privateMode
                      );

                      setShowMoreMenu(
                        false
                      );

                    }}
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
                    `message-row ${
                      msg.role === "user"
                        ? "user-row"
                        : ""
                    }`
                  }
                  key={msg.id}
                >

                  <div
                    className={
                      `avatar ${
                        msg.role ===
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
          {loggedIn ? "Deepika" : "Guest Mode"}
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
                  onChange={() =>
                    setPrivateMode(
                      !privateMode
                    )
                  }
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

          <div className="modal auth-modal">

            <button
              className="auth-close"
              onClick={() =>
                setShowAuth(false)
              }
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


            <p className="auth-description">

              {authMode === "login"
                ? "Sign in to continue your personalized AI experience."
                : "Create an account to keep your conversations and preferences."}

            </p>


            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
            />


            <input
              className="auth-input"
              type="password"
              placeholder="Password"
            />


            <button
              className="auth-submit"
              onClick={() => {

                setLoggedIn(true);

                setShowAuth(false);

              }}
            >

              {authMode === "login"
                ? "Login"
                : "Create account"}

            </button>


            <button
              className="auth-switch"
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

    </div>
  );
}


export default App;