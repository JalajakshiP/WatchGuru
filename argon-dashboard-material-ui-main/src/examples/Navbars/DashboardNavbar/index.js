import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// react-router components
import { useLocation, Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";

// Argon Dashboard 2 MUI example components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Argon Dashboard 2 MUI context
import {
  useArgonController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";
import { apiUrl } from "config/config";
import Badge from "@mui/material/Badge";

// Images
import team2 from "assets/images/team-2.jpg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";

function DashboardNavbar({ absolute, light, isMini, setSearchQuery }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const route = useLocation().pathname.split("/").slice(1);
const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchText(value);         // update local input field
    if (setSearchQuery) {
      setSearchQuery(value);      // lift state up to MoviesList
    }
  };

  useEffect(() => {
    const getNotifications = async () => {
      const username = localStorage.getItem("user");
      if (username) {
        try {
          const response = await fetch(`${apiUrl}/notifications?user=${username}`, {
            method: "GET",
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch notifications");
          const data = await response.json();
          setNotifications(data.notifications); // Assuming data contains notifications array
        } catch (error) {
          console.error("Error fetching notifications:", error);
          setNotifications([]); // Handle error by setting an empty array
        }
      }
    };
  
    getNotifications(); // Fetch notifications when the component mounts or username changes
  }, []);

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  const handleNotificationClick = async (notif) => {
    try{
    await fetch(`${apiUrl}/notifications/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationId: notif.id }),
    });
    handleCloseMenu();
    if (notif.type === "message") {
      // window.location.href = `/chats`;
      navigate("/Chatting", {
        state: {
          friendId: notif.from_user,
          friendName: notif.from_username,
        },
      })
      // messages?friendId=${notif.from_user}`;
    } else if (notif.type === "friend_request" || notif.type === "friend_accept") {
      window.location.href = `/friends`;
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  }
  catch (error) {
    console.error("Error marking notification as read:", error);
  }
  };
  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      {notifications.length === 0 ? (
      <NotificationItem
        title={["No new notifications"]}
        date=""
        onClick={handleCloseMenu}
      />
    ) : (
      notifications.map((notif, index) => (
        <NotificationItem
          key={index}
          image={
            <Icon fontSize="small">
              {notif.type === "friend_request" ? "person_add" : "person"}
            </Icon>
          }
          title={[notif.content]}
          date={new Date(notif.created_at).toLocaleString()}
          onClick={() => handleNotificationClick(notif)}
        />
      ))
    )}
    </Menu>
  );
  const username = localStorage.getItem("user");
  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme, { navbarType })}>
        <ArgonBox
          color={light && transparentNavbar ? "white" : "dark"}
          mb={{ xs: 1, md: 0 }}
          sx={(theme) => navbarRow(theme, { isMini })}
        >
          <Breadcrumbs
            icon="home"
            title={route[route.length - 1]}
            route={route}
            light={transparentNavbar ? light : false}
          />
          <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
            {miniSidenav ? "menu_open" : "menu"}
          </Icon>
        </ArgonBox>
        {isMini ? null : (
          <ArgonBox sx={(theme) => navbarRow(theme, { isMini })}>
            <ArgonBox pr={1}>
              <ArgonInput
                placeholder="Type here..."
                value={searchText}
                onChange={handleSearchChange}
                startAdornment={
                  <Icon fontSize="small" style={{ marginRight: "6px" }}>
                    search
                  </Icon>
                }
              />
            </ArgonBox>
            <ArgonBox color={light ? "white" : "inherit"}>
              <Link to="/profile" style={{ textDecoration: "none" }}>
                <IconButton sx={navbarIconButton} size="small">
                  <Icon
                    sx={({ palette: { dark, white } }) => ({
                      color: light && transparentNavbar ? white.main : dark.main,
                    })}
                  >
                    account_circle
                  </Icon>
                  <ArgonTypography
                    variant="button"
                    fontWeight="medium"
                    color={light && transparentNavbar ? "white" : "dark"}
                  >
                    {username}
                  </ArgonTypography>
                </IconButton>
              </Link>
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon>{miniSidenav ? "menu_open" : "menu"}</Icon>
              </IconButton>
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon>settings</Icon>
              </IconButton>
              <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <Icon>notifications</Icon>
                </Badge>
              </IconButton>
              {renderMenu()}
            </ArgonBox>
          </ArgonBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: true,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
  setSearchQuery: PropTypes.func,
};

export default DashboardNavbar;
