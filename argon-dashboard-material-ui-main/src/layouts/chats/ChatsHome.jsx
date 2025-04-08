import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "config/config";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";

function ChatsHome() {
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch(`${apiUrl}/friends`, {
          credentials: "include",
        });
        const data = await res.json();
        setFriends(data.friends);
      } catch (err) {
        console.error("Failed to fetch friends", err);
      }
    };

    fetchFriends();
  }, []);

  return (
    <ArgonBox>
      <ArgonTypography variant="h4" mb={2}>Your Friends</ArgonTypography>
      {friends.map((friend) => (
        <ArgonBox key={friend.user_id} mb={2}>
          <ArgonTypography>{friend.username}</ArgonTypography>
          <ArgonButton
            size="small"
            onClick={() =>
                navigate("/Chatting", { state: { friendId: friend.user_id, friendName: friend.username } })
              }
              
          >
            Chat
          </ArgonButton>
        </ArgonBox>
      ))}
    </ArgonBox>
  );
}

export default ChatsHome;
