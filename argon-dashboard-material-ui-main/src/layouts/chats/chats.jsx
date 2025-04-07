import React, { useEffect, useState } from "react";
import { apiUrl } from "config/config";
import ArgonBox from "components/ArgonBox";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";

const Chats = ({ friendId, username }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [unread, setUnread] = useState({});

  // Fetch chat history
  const fetchMessages = async () => {
    const res = await fetch(`${apiUrl}/messages/${friendId}`, {
      credentials: "include",
    });
    const data = await res.json();
    setMessages(data.messages);
  };

  // Poll unread notifications
  const fetchUnread = async () => {
    const res = await fetch(`${apiUrl}/messages/unread`, {
      credentials: "include",
    });
    const data = await res.json();
    const unreadMap = {};
    data.unread.forEach(u => unreadMap[u.sender_id] = u.count);
    setUnread(unreadMap);
  };

  const handleSend = async () => {
    if (!messageInput.trim()) return;

    await fetch(`${apiUrl}/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ receiverId: friendId, message: messageInput }),
    });

    setMessageInput("");
    fetchMessages(); // update chat
  };

  useEffect(() => {
    fetchMessages();
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [friendId]);

  return (
    <ArgonBox>
      <h3>Chat with {username}</h3>
      <div style={{ maxHeight: "300px", overflowY: "scroll" }}>
        {messages.map((msg) => (
          <div key={msg.message_id} style={{ textAlign: msg.sender_id === friendId ? "left" : "right" }}>
            <p>{msg.message}</p>
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>

      <ArgonBox mt={2}>
        <ArgonInput
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
        />
        <ArgonButton onClick={handleSend} color="info" fullWidth>
          Send
        </ArgonButton>
      </ArgonBox>

      {Object.entries(unread).length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Unread Messages:</strong>
          <ul>
            {Object.entries(unread).map(([senderId, count]) => (
              <li key={senderId}>From User {senderId}: {count} unread</li>
            ))}
          </ul>
        </div>
      )}
    </ArgonBox>
  );
};

export default Chats;
