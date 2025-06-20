// frontend/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- IMPOR KOMPONEN HALAMAN USER ---
import Index from './pages/Index.jsx';
import Tentang from './pages/Tentang.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Pembayaran from './pages/Pembayaran.jsx';

// --- IMPOR KOMPONEN HALAMAN ADMIN (akan diimplementasikan nanti) ---
import DashboardAdmin from './pages/admin/Dashboard.jsx'; // Mengganti nama agar tidak konflik dengan JS
import PendingRegistrasiAdmin from './pages/admin/PendingRegistrasi.jsx';
import UserAdmin from './pages/admin/User.jsx';
import MotorAdmin from './pages/admin/Motor.jsx';
import ReservasiAdmin from './pages/admin/ReservasiAdmin.jsx';
import PembayaranAdmin from './pages/admin/PembayaranAdmin.jsx';
import TestimoniAdmin from './pages/admin/TestimoniAdmin.jsx';
import SettingsAdmin from './pages/admin/Settings.jsx';


function App() {
  return (
    <div className="App">
      <Routes>
        {/* RUTE HALAMAN UTAMA / PUBLIK */}
        <Route path="/" element={<Index />} />
        <Route path="/tentang" element={<Tentang />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pembayaran" element={<Pembayaran />} />

        {/* RUTE HALAMAN ADMIN (akan dilindungi dengan autentikasi JWT nanti) */}
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/admin/pending-registrasi" element={<PendingRegistrasiAdmin />} />
        <Route path="/admin/user" element={<UserAdmin />} />
        <Route path="/admin/motor" element={<MotorAdmin />} />
        <Route path="/admin/reservasi" element={<ReservasiAdmin />} />
        <Route path="/admin/pembayaran" element={<PembayaranAdmin />} />
        <Route path="/admin/testimoni" element={<TestimoniAdmin />} />
        <Route path="/admin/settings" element={<SettingsAdmin />} />
        
        {/* Tambahkan rute lain jika ada */}
      </Routes>
    </div>
  );
}

export default App;