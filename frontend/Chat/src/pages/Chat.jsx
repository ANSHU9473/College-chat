import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://college-chat-dpqa.vercel.app"); // backend URL

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const roomId = "college-room"; // everyone in same room (for now)

  useEffect(() => {
    // join room
    socket.emit("join_room", roomId);

    // receive messages
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const msgData = {
      roomId,
      sender: user.anonymousName || user.email,
      text: newMessage,
    };

    socket.emit("send_message", msgData);
    setNewMessage("");
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>College Chat</h1>

      <button onClick={() => { localStorage.removeItem("user"); window.location.href = "/login"; }}>
        Logout
      </button>
      <button style={{ marginLeft: 10 }} onClick={() => window.location.href = "/anonymous"}>
        Start Chat
      </button>

      {/* Chat messages */}
      <div
        style={{
          background: "#222",
          height: "300px",
          overflowY: "scroll",
          margin: "20px 0",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet...</p>
        ) : (
          messages.map((msg, idx) => (
            <p key={idx}>
              <strong>{msg.sender}:</strong> {msg.text}
            </p>
          ))
        )}
      </div>

      {/* Input box */}
      <input
        type="text"
        placeholder="Type a message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
