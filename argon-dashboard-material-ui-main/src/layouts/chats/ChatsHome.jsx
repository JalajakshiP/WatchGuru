import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "config/config";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

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
    <DashboardLayout>
      <DashboardNavbar  showSearch={false}/>
      <ArgonBox p={3}>
        <ArgonTypography variant="h4" mb={3}>
          Friends🫂
        </ArgonTypography>

        {friends.length === 0 ? (
          <ArgonTypography variant="body2" color="text">
            You don't have any friends yet.
          </ArgonTypography>
        ) : (
          friends.map((friend) => (
            <ArgonBox
              key={friend.user_id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={2}
              mb={2}
              borderRadius={2}
              sx={{
                backgroundColor: "#f8f9fa",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              <ArgonTypography variant="h6" color="dark">
                {friend.username}
              </ArgonTypography>
              <ArgonButton
                size="small"
                color="info"
                onClick={() =>
                  navigate("/Chatting", {
                    state: {
                      friendId: friend.user_id,
                      friendName: friend.username,
                    },
                  })
                }
              >
                Chat
              </ArgonButton>
            </ArgonBox>
          ))
        )}
      </ArgonBox>
    </DashboardLayout>
  );
}

export default ChatsHome;
