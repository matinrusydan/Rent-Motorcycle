// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'; // Mengubah ke .jsx untuk konsistensi

// Impor semua file CSS global di sini
import './assets/css/global.css'; // Pastikan jalur sesuai

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);