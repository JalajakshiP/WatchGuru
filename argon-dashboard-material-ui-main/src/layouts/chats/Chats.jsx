import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "config/config";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";
import { useLocation } from "react-router-dom";
import { TIME } from "sequelize";

function Chats() {
    const location = useLocation();
    const { friendId, friendName } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const[currentuser, setCurrentUser] = useState(null);

  // Fetch chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // console.log("broooo",friendId);
        const res = await fetch(`${apiUrl}/messages?friendId=${friendId}`, {
          credentials: "include",
        });
        // console.log(friendId);
        const data = await res.json();
        // console.log("Messages:", data.user);
        setCurrentUser(data.user);
        setMessages(data.message);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [friendId]);

  // Handle send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
        friend:  friendId,
         msg: newMessage,
        }),
      });

      if (res.ok) {
        setMessages([...messages, { sender_id:currentuser,message: newMessage, timestamp: new TIME() }]);
        setNewMessage("");
      } else {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <ArgonBox>
      <ArgonTypography variant="h4" mb={2}>Chat with Friend {friendName}</ArgonTypography>
    
      <ArgonBox mb={3} style={{ maxHeight: 300, overflowY: "auto" }}>
        {messages.map((m, index) => (
          <ArgonBox key={index} mb={1}>
            <ArgonTypography variant="body2">
              <strong>{m.sender_id === currentuser ? "You" : friendName}:</strong> {m.message}
            </ArgonTypography>
          </ArgonBox>
        ))}
      </ArgonBox>

      <ArgonBox display="flex" gap={1}>
        <ArgonInput
          placeholder="Type your message..."
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <ArgonButton onClick={handleSend} color="info">Send</ArgonButton>
      </ArgonBox>
    </ArgonBox>
  );
}

export default Chats;
