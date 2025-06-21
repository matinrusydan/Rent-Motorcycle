// frontend/src/components/MotorCard.jsx

import React, { useState } from 'react';

const MotorCard = ({ 
    brand, 
    type, 
    price, 
    specs, 
    gambar_motor, // Field dari database
    openReservasiPopup,
    motorId // Tambahkan motorId untuk reservasi yang lebih spesifik
}) => {
    const [imageError, setImageError] = useState(false);
    
    // Function untuk generate URL gambar
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        
        // Jika sudah full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // Jika path relatif, gabungkan dengan base URL
        const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
        
        // Pastikan path tidak dimulai dengan '/' ganda
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        
        return `${baseUrl}${cleanPath}`;
    };
    
    const handleImageError = (e) => {
        console.error('Image failed to load:', getImageUrl(gambar_motor));
        setImageError(true);
        // Hide broken image, show placeholder
        e.target.style.display = 'none';
    };

    const handleImageLoad = (e) => {
        console.log('Image loaded successfully:', getImageUrl(gambar_motor));
        setImageError(false);
        e.target.style.display = 'block';
    };

    const imageUrl = getImageUrl(gambar_motor);
    
    // Debug logging
    console.log('MotorCard Debug:', {
        brand,
        type,
        gambar_motor,
        generatedImageUrl: imageUrl,
        hasImagePath: !!gambar_motor
    });

    return (
        <div className="motor-card">
            <div className="motor-image" style={{ position: 'relative', overflow: 'hidden' }}>
                {gambar_motor && imageUrl ? (
                    <>
                        {/* Real image */}
                        <img
                            src={imageUrl}
                            alt={`${brand} ${type}`}
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                            style={{ 
                                width: '100%', 
                                height: '200px', 
                                objectFit: 'cover',
                                borderRadius: '8px',
                                display: imageError ? 'none' : 'block'
                            }}
                        />
                        
                        {/* Placeholder yang muncul jika gambar error */}
                        <div 
                            className="image-placeholder"
                            style={{
                                width: '100%',
                                height: '200px',
                                display: imageError ? 'flex' : 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '8px',
                                fontSize: '48px',
                                color: '#ccc',
                                position: imageError ? 'static' : 'absolute',
                                top: 0,
                                left: 0
                            }}
                        >
                            🏍️
                        </div>
                    </>
                ) : (
                    // Placeholder default jika tidak ada gambar_motor
                    <div 
                        className="image-placeholder"
                        style={{
                            width: '100%',
                            height: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '8px',
                            fontSize: '48px',
                            color: '#ccc'
                        }}
                    >
                        🏍️
                    </div>
                )}
            </div>
            
            <div className="motor-info">
                <h4 className="motor-name">{brand} {type}</h4>
                <p className="motor-price">{price}</p>
                <p className="motor-specs">{specs}</p>
                <button 
                    className="btn-reserve" 
                    onClick={() => openReservasiPopup(brand, type, motorId)}
                >
                    Reservasi
                </button>
            </div>
        </div>
    );
};

export default MotorCard;