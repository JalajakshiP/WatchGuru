import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "config/config"; 
const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        const res = await fetch(`${apiUrl}/logout`, {
          method: "POST",
          credentials: "include", // <-- important for session cookies
        });

        if (res.ok) {
          navigate("/authentication/sign-in");
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    logout();
  }, [navigate]);

  return <p>Logging out...</p>;
};

export default Logout;
