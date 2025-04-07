import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

  return isLoggedIn ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
