import React, { useState, useEffect } from "react";
import { apiUrl } from "config/config"; 
import { useNavigate } from "react-router-dom";
// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Import your background image
import bgImage from "assets/images/guru_img.jpg"; // Make sure the image exists at this path

function Cover() {
  const navigate = useNavigate(); // ✅ For redirecting to Select Genres page

  useEffect(() => {
      const checkLogin = async () => {
        try {
          const res = await fetch(`${apiUrl}/isLoggedIn`, {
            method: "GET",
            credentials: "include", // Important to send session cookie
          });
  
          if (res.status === 200) {
            // User is already logged in
            navigate("/dashboard"); // Redirect to wherever logged-in users go
          }
        } catch (err) {
          console.error("Error checking login status:", err);
          // Do nothing, stay on home page
        }
      };
  
      checkLogin();
    }, [navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");

  const handleContinue = () => {
    if (!name || !email || !password || !birthdate) {
      alert("Please fill all fields.");
      return;
    }
    const minDate = new Date("1900-01-01");
    const maxDate = new Date("2020-01-01");
    const enteredDate = new Date(birthdate);

    if (enteredDate < minDate || enteredDate > maxDate || isNaN(enteredDate.getTime())) {
      alert("Please enter a valid birthdate.");
      return;
    }
    // Navigate to next page with state
    navigate("/authentication/select-genres", {
      state: { name, email, password, birthdate }
    });
  };

  return (
    <CoverLayout
      title="Welcome to WatchGuru"
      description="Find the best watches that suit your style and time."
      image={bgImage}
      imgPosition="top"
      button={{ color: "dark", variant: "gradient" }}
    >
      <Card>
        <ArgonBox pt={2} pb={3} px={3}>
          <ArgonBox component="form" role="form">
            <ArgonBox mb={2}>
              <ArgonInput type="username" placeholder="Name" value={name} onChange={e => setName(e.target.value)}/>
            </ArgonBox>
            <ArgonBox mb={2}>
              <ArgonInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
            </ArgonBox>
            <ArgonBox mb={2}>
              <ArgonInput type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)}/>
            </ArgonBox>
            <ArgonBox mb={2}>
              <ArgonInput type="date" placeholder="Birthdate" value={birthdate} onChange={e => setBirthdate(e.target.value)}/>
            </ArgonBox>
            <ArgonBox mt={4} mb={1}>
              <ArgonButton 
                // component={Link}
                // to="/authentication/select-genres"
                onClick={handleContinue}
                variant="gradient" 
                color="dark">
                Continue
              </ArgonButton>
            </ArgonBox>
            <ArgonBox mt={2}>
              <ArgonTypography variant="button" color="text" fontWeight="regular">
                Already have an account?&nbsp;
                <ArgonTypography
                  component={Link}
                  to="/authentication/sign-in"
                  variant="button"
                  color="dark"
                  fontWeight="bold"
                  textGradient
                >
                  Sign in
                </ArgonTypography>
              </ArgonTypography>
            </ArgonBox>
          </ArgonBox>
        </ArgonBox>
      </Card>
    </CoverLayout>
  );
}

export default Cover;