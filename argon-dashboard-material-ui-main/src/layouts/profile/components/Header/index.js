import React, { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonAvatar from "components/ArgonAvatar";

// Argon Dashboard 2 MUI example components
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Argon Dashboard 2 MUI base styles
import breakpoints from "assets/theme/base/breakpoints";

// Images
import burceMars from "assets/images/girl.png";
import { useNavigate } from 'react-router-dom';

function Header({ tabValue, setTabValue }) {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");

  useEffect(() => {
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    window.addEventListener("resize", handleTabsOrientation);
    handleTabsOrientation();

    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, []);

  const navigate = useNavigate();

  const handleSetTabValue = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) navigate("/friends");
    else if (newValue === 1) navigate("/chats");
  };

  const username = localStorage.getItem("user");

  return (
    <ArgonBox position="relative">
      <DashboardNavbar  absolute light showSearch={false} />
      <ArgonBox height="220px" />
      <Card
        sx={{
          py: 2,
          px: 2,
          boxShadow: ({ boxShadows: { md } }) => md,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <ArgonAvatar
              src={burceMars}
              alt="profile-image"
              variant="rounded"
              size="xl"
              shadow="sm"
            />
          </Grid>
          <Grid item>
            <ArgonBox height="100%" mt={0.5} lineHeight={1}>
              <ArgonTypography variant="h5" fontWeight="medium">
                {username}
              </ArgonTypography>
            </ArgonBox>
          </Grid>
          <Grid item xs={12} md={6} lg={10} sx={{ ml: "auto" }}>
            <AppBar position="static">
              <Tabs orientation={tabsOrientation} value={tabValue} onChange={handleSetTabValue}>
                <Tab
                  label="Friends"
                  icon={<i className="ni ni-single-02" style={{ marginTop: "6px", marginRight: "8px" }} />}
                />
                <Tab
                  label="Chats"
                  icon={<i className="ni ni-chat-round" style={{ marginTop: "6px", marginRight: "8px" }} />}
                />
                <Tab
                  label="Reviews"
                  icon={<i className="ni ni-satisfied" style={{ marginTop: "6px", marginRight: "8px" }} />}
                />
                <Tab
                  label="Profile"
                  icon={<i className="ni ni-single-copy-04" style={{ marginTop: "6px", marginRight: "8px" }} />}
                />
              </Tabs>
            </AppBar>
          </Grid>
        </Grid>
      </Card>
    </ArgonBox>
  );
}

export default Header;
