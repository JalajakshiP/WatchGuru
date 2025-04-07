import React from 'react';
import Dashboard from "layouts/dashboard";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import HomePage from "layouts/home";
import SelectGenres from "layouts/authentication/select-genres";
import Friends from "layouts/friends/friends";
import ChatsWrapper from "layouts/chats/ChatsWrapper";
import Shows from "layouts/shows/shows";
import Movies from "layouts/movies/movies";
import Anime from "layouts/anime/anime";
import Logout from "layouts/authentication/logout/logout";
import ArgonBox from "components/ArgonBox";
import ProtectedRoute from "layouts/authentication/components/ProtectedRoute/ProtectedRoutes"; // 👈 added here

const routes = [
  {
    type: "route",
    name: "Home",
    key: "home",
    route: "/",
    component: <HomePage />,
    layout: "main",
  },
  {
    type: "route",
    name: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-tv-2" />,
    component: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    layout: "dashboard",
  },
  { type: "title", title: "Account Pages", key: "account-pages" },
  {
    type: "route",
    name: "Profile",
    key: "profile",
    route: "/profile",
    icon: <ArgonBox component="i" color="dark" fontSize="14px" className="ni ni-single-02" />,
    component: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
    layout: "dashboard",
  },
  {
    type: "route",
    name: "Sign In",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: (
      <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-single-copy-04" />
    ),
    component: <SignIn />,
    layout: "main",
  },
  {
    type: "route",
    name: "Sign Up",
    key: "sign-up",
    route: "/authentication/sign-up",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-collection" />,
    component: <SignUp />,
    layout: "main",
  },
  {
    type: "route",
    name: "Select Genres",
    key: "select-genres",
    route: "/authentication/select-genres",
    component: (
      <ProtectedRoute>
        <SelectGenres />
      </ProtectedRoute>
    ),
    layout: "main",
  },
  {
    type: "route",
    name: "Friends",
    key: "friends",
    route: "/friends",
    component: (
      <ProtectedRoute>
        <Friends />
      </ProtectedRoute>
    ),
    layout: "main",
  },
  {
    type: "route",
    name: "Chats",
    key: "chats",
    route: "/chats/:friendId",
    component: (
      <ProtectedRoute>
        <ChatsWrapper />
      </ProtectedRoute>
    ),
    layout: "main",
  },
  {
    type: "route",
    name: "Shows",
    key: "shows",
    route: "/shows",
    component: (
      <ProtectedRoute>
        <Shows />
      </ProtectedRoute>
    ),
    layout: "dashboard",
  },
  {
    type: "route",
    name: "Movies",
    key: "movies",
    route: "/movies",
    component: (
      <ProtectedRoute>
        <Movies />
      </ProtectedRoute>
    ),
    layout: "dashboard",
  },
  {
    type: "route",
    name: "Anime",
    key: "anime",
    route: "/anime",
    component: (
      <ProtectedRoute>
        <Anime />
      </ProtectedRoute>
    ),
    layout: "dashboard",
  },
  {
    type: "route",
    name: "Logout",
    key: "logout",
    route: "/logout",
    component: (
      <ProtectedRoute>
        <Logout />
      </ProtectedRoute>
    ),
    layout: "main",
  },
];

export default routes;
