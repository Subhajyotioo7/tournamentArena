import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";


import "./index.css";
import App from "./App";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MyRooms from "./pages/MyRooms";
import MyInvitations from "./pages/MyInvitations";
import WalletTransactions from "./pages/WalletTransactions";
import AdminDashboard from "./pages/AdminDashboard";
import KYC from "./pages/KYC";
import Withdraw from "./pages/Withdraw";
import Tournament from "./pages/Tournament";
import TournamentParticipants from "./pages/TournamentParticipants";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateTournament from "./pages/CreateTournament";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />

            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<Profile />} />

            <Route path="my-rooms" element={<MyRooms />} />
            <Route path="my-invitations" element={<MyInvitations />} />


            <Route path="wallet/transactions" element={<WalletTransactions />} />
            <Route path="withdraw" element={<Withdraw />} />

            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/tournament/:id/participants" element={<TournamentParticipants />} />
            <Route path="kyc" element={<KYC />} />

            {/* ✅ IMPORTANT: PLURAL ROUTES */}
            <Route path="tournaments/:id" element={<Tournament />} />
            <Route
              path="tournaments/:id/participants"
              element={<TournamentParticipants />}
            />

            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:uid/:token" element={<ResetPassword />} />
            <Route path="create-tournament" element={<CreateTournament />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);


