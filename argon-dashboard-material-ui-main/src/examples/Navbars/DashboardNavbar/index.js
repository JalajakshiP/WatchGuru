import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";
import Badge from "@mui/material/Badge";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

import {
  useArgonController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

import { apiUrl } from "config/config";

function DashboardNavbar({ absolute, light, isMini, setSearchQuery, showSearch }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const route = useLocation().pathname.split("/").slice(1);
  const navigate = useNavigate();

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchText(value);
    if (setSearchQuery) {
      setSearchQuery(value);
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
          setNotifications(data.notifications);
        } catch (error) {
          console.error("Error fetching notifications:", error);
          setNotifications([]);
        }
      }
    };
    getNotifications();
  }, []);

  useEffect(() => {
    if (fixedNavbar) setNavbarType("sticky");
    else setNavbarType("static");

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    window.addEventListener("scroll", handleTransparentNavbar);
    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);

  const handleNotificationClick = async (notif) => {
    try {
      await fetch(`${apiUrl}/notifications/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: notif.id }),
      });
      handleCloseMenu();
      if (notif.type === "message") {
        navigate("/Chatting", {
          state: {
            friendId: notif.from_user,
            friendName: notif.from_username,
          },
        });
      } else if (notif.type === "friend_request" || notif.type === "friend_accept") {
        window.location.href = `/friends`;
      } else if (notif.type === "movie_shared") {
        navigate(`/movie/${notif.movie_id}`);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      {notifications.length === 0 ? (
        <NotificationItem title={["No new notifications"]} date="" onClick={handleCloseMenu} />
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

        {!isMini && (
          <ArgonBox sx={(theme) => navbarRow(theme, { isMini })}>
            {showSearch && (
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
            )}
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
              {/* <IconButton
                size="small"
                color={light && transparentNavbar ? "white" : "dark"}
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon>settings</Icon>
              </IconButton> */}
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

DashboardNavbar.defaultProps = {
  absolute: false,
  light: true,
  isMini: false,
  showSearch: true,
};

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
  setSearchQuery: PropTypes.func,
  showSearch: PropTypes.bool,
};

export default DashboardNavbar;
