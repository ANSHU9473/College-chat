
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function createSocket() {
  return io("http://localhost:5000", { transports: ["websocket"] });
}

export default function AnonymousChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [status, setStatus] = useState("Connecting to random user...");
  const [disconnected, setDisconnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = createSocket();
    setSocket(newSocket);
    newSocket.emit("joinAnonymousChat");

    newSocket.on("waitingForPartner", () => {
      setStatus("Waiting for a random user to connect...");
    });

    newSocket.on("chatStarted", ({ roomId }) => {
      setRoomId(roomId);
      setStatus("Connected! Start chatting anonymously.");
    });

    newSocket.on("receiveAnonymousMessage", ({ text, sender }) => {
      // Only add received messages if not sent by self
      if (sender !== newSocket.id) {
        setMessages((prev) => [...prev, { text, self: false }]);
      }
    });

    newSocket.on("partnerDisconnected", () => {
      setStatus("Your partner disconnected. Click to start a new chat.");
      setDisconnected(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "" && roomId && socket) {
      setMessages((prev) => [...prev, { text: message, self: true }]);
      socket.emit("sendAnonymousMessage", { roomId, text: message });
      setMessage("");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setRoomId(null);
    setDisconnected(false);
    setStatus("Connecting to random user...");
    if (socket) socket.emit("joinAnonymousChat");
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Anonymous College Chat</h2>
      <div style={{ marginBottom: 10, color: "#555" }}>{status}</div>
      <div style={{ border: "1px solid #aaa", padding: "10px", height: "200px", overflowY: "scroll", background: "#f9f9f9", marginBottom: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: msg.self ? "flex-end" : "flex-start", margin: "6px 0" }}>
            <span style={{
              background: msg.self ? "#e3f2fd" : "#fff",
              color: msg.self ? "#1976d2" : "#333",
              padding: "6px 12px",
              borderRadius: 16,
              maxWidth: "70%",
              wordBreak: "break-word",
              textAlign: msg.self ? "right" : "left",
              boxShadow: msg.self ? "0 1px 4px #1976d233" : "0 1px 4px #3332"
            }}>{msg.text}</span>
          </div>
        ))}
      </div>
      {!disconnected ? (
        <>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ width: "70%", marginRight: 8 }}
            onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          />
          <button onClick={sendMessage} style={{ width: "25%" }}>Send</button>
        </>
      ) : (
        <button onClick={startNewChat}>Start New Chat</button>
      )}
    </div>
  );
}
