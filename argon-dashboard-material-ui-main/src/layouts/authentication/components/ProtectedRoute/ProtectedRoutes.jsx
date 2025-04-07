import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:4000/isLoggedIn", {
          method: "GET",
          credentials: "include", // crucial for sending cookies
        });

        if (res.status === 200) {
          setLoading(false); // ✅ Allow rendering
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) return null; // or loader/spinner

  return children;
};

export default ProtectedRoute;
