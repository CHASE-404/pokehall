// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import BuildTeam from './BuildTeam'; 
import TeamManagement from './TeamManagement';

import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/build-team" element={<BuildTeam />} />
        <Route path="/team-management" element={<TeamManagement />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);