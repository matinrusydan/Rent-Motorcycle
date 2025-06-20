// frontend/src/components/MotorCard.jsx

import React from 'react';
// Tidak perlu mengimpor CSS jika sudah diimpor di komponen induk seperti Index.jsx,
// atau jika Anda menggunakan CSS Modules.

const MotorCard = ({ brand, type, price, specs, openReservasiPopup }) => {
    // openReservasiPopup adalah fungsi yang akan diterima dari komponen induk (misal Index.jsx)
    // untuk membuka popup reservasi dengan detail motor yang relevan.
    return (
        <div className="motor-card">
            <div className="motor-image">🏍️</div>
            <h4>{brand} {type}</h4>
            <p className="price">{price}</p>
            <p className="specs">{specs}</p>
            {/* Memanggil fungsi yang diterima dari props saat tombol diklik */}
            <button className="btn-reserve" onClick={() => openReservasiPopup(brand, type)}>
                Reservasi
            </button>
        </div>
    );
};

export default MotorCard;