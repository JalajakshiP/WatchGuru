// src/chats/ChatsWrapper.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import chats from "./chats";
import { apiUrl } from "config/config";

const ChatsWrapper = () => {
  const { friendId } = useParams();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const res = await fetch(`${apiUrl}/user/${friendId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setUsername(data.username);
      } catch (err) {
        console.error("Failed to fetch friend's username");
      }
    };

    fetchUsername();
  }, [friendId]);

  return <chats friendId={friendId} username={username || `User ${friendId}`} />;
};

export default ChatsWrapper;
