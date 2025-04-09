import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "config/config";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

function Chats() {
  const location = useLocation();
  const { friendId, friendName } = location.state || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentuser, setCurrentUser] = useState(null);
  const chatContainerRef = useRef(null);

  // Fetch chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${apiUrl}/messages?friendId=${friendId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setCurrentUser(data.user);
        setMessages(data.message);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [friendId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          friend: friendId,
          msg: newMessage,
        }),
      });

      if (res.ok) {
        setMessages([...messages, { sender_id: currentuser, message: newMessage }]);
        setNewMessage("");
      } else {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <ArgonBox p={3}>
        <ArgonTypography variant="h4" mb={3}>
          Chat with {friendName}
        </ArgonTypography>

        {/* Chat message area */}
        <ArgonBox
          ref={chatContainerRef}
          sx={{
            backgroundColor: "#E2F5F6",
            borderRadius: 5,
            padding: 2,
            maxHeight: "60vh",
            overflowY: "auto",
            mb: 3,
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.1)",
          }}
        >
          {messages.map((m, index) => {
            const isMe = m.sender_id === currentuser;

            return (
              <ArgonBox
                key={index}
                display="flex"
                justifyContent={isMe ? "flex-end" : "flex-start"}
                mb={1}
              >
                <ArgonBox
                  px={2}
                  py={1}
                  borderRadius={2}
                  sx={{
                    backgroundColor: isMe ? "#E7DDFF" : "#ffffff",
                    color: isMe ? "#ffffff" : "#111",
                    maxWidth: "70%",
                    boxShadow: 2,
                  }}
                >
                  <ArgonTypography variant="body2">
                    {m.message}
                  </ArgonTypography>
                </ArgonBox>
              </ArgonBox>
            );
          })}
        </ArgonBox>

        {/* Input box */}
        <ArgonBox display="flex" gap={1}>
          <ArgonInput
            placeholder="Type your message..."
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <ArgonButton onClick={handleSend} color="info">
            Send
          </ArgonButton>
        </ArgonBox>
      </ArgonBox>
    </DashboardLayout>
  );
}

export default Chats;
