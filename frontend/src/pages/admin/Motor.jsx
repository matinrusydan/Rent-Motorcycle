// frontend/src/pages/Motor.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar.jsx'; 
import motorService from '../../services/motorService.js';
import '../../assets/css/admin/sidebar.css';   
import '../../assets/css/admin/motor.css';     
import '../../assets/css/global.css';

const Motor = () => {
    const [motorData, setMotorData] = useState([]);
    const [motorStats, setMotorStats] = useState({
        total: 0,
        available: 0,
        rented: 0,
        maintenance: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentMotor, setCurrentMotor] = useState(null);
    const [error, setError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // New state for view toggle
    const [formData, setFormData] = useState({
        brand: '',
        type: '',
        price: '',
        specs: '',
        status: 'available',
        description: '',
        image: null
    });

    // Get unique brands from data for filter options
    const getUniqueBrands = () => {
        const brands = [...new Set(motorData.map(motor => motor.brand))];
        return brands.filter(brand => brand); // Remove empty values
    };

    // Handle sidebar toggle for mobile
    const handleSidebarToggle = () => {
        console.log('Sidebar toggle clicked');
    };

    // Fetch motors from API
    const fetchMotors = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const filters = {
                search: searchTerm || undefined,
                brand: brandFilter !== 'all' ? brandFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
            };

            const response = await motorService.getAllMotors(filters);
            
            if (response.success) {
                setMotorData(response.data || []);
                setMotorStats(response.stats || {
                    total: 0,
                    available: 0,
                    rented: 0,
                    maintenance: 0
                });
            } else {
                throw new Error(response.message || 'Failed to fetch motors');
            }
        } catch (error) {
            console.error('Error fetching motors:', error);
            setError('Gagal memuat data motor: ' + error.message);
            setMotorData([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, brandFilter, statusFilter]);

    useEffect(() => {
        fetchMotors();
    }, [fetchMotors]);

    const handleCheckboxChange = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === motorData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(motorData.map(item => item.id));
        }
    };

    // FIXED: Simplified modal opening function
    const openModal = (mode, motor = null) => {
        console.log('openModal called with:', mode, motor);
        
        setModalMode(mode);
        
        setCurrentMotor(motor);
        setError(null);
        
        if (mode === 'edit' && motor) {
            setFormData({
                brand: motor.brand || '',
                type: motor.type || '',
                price: motor.price || '',
                specs: motor.specs || '',
                status: motor.status || 'available',
                description: motor.description || '',
                image: null
            });
        } else {
            setFormData({
                brand: '',
                type: '',
                price: '',
                specs: '',
                status: 'available',
                description: '',
                image: null
            });
        }
        
        // FIXED: Simple state update
        setShowModal(true);
        console.log('setShowModal(true) called');
    };

    const closeModal = () => {
        setShowModal(false);
        setCurrentMotor(null);
        setFormData({
            brand: '',
            type: '',
            price: '',
            specs: '',
            status: 'available',
            description: '',
            image: null
        });
        setError(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.brand || !formData.type || !formData.price) {
            setError('Brand, tipe, dan harga wajib diisi');
            return;
        }

        if (parseFloat(formData.price) <= 0) {
            setError('Harga harus lebih dari 0');
            return;
        }

        try {
            setSubmitLoading(true);
            setError(null);

            const motorData = {
                brand: formData.brand,
                type: formData.type,
                price: parseFloat(formData.price),
                specs: formData.specs,
                status: formData.status,
                description: formData.description,
                image: formData.image
            };

            let response;
            if (modalMode === 'add') {
                response = await motorService.createMotor(motorData);
            } else {
                response = await motorService.updateMotor(currentMotor.id, motorData);
            }

            if (response.success) {
                await fetchMotors(); // Refresh data
                closeModal();
                alert(modalMode === 'add' ? 'Motor berhasil ditambahkan!' : 'Motor berhasil diperbarui!');
            } else {
                throw new Error(response.message || 'Failed to save motor');
            }
        } catch (error) {
            console.error('Error saving motor:', error);
            setError('Gagal menyimpan motor: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus motor ini?')) {
            return;
        }

        try {
            const response = await motorService.deleteMotor(id);
            
            if (response.success) {
                await fetchMotors(); // Refresh data
                alert('Motor berhasil dihapus!');
            } else {
                throw new Error(response.message || 'Failed to delete motor');
            }
        } catch (error) {
            console.error('Error deleting motor:', error);
            alert('Gagal menghapus motor: ' + error.message);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            alert('Pilih minimal satu motor untuk dihapus!');
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} motor yang dipilih?`)) {
            return;
        }

        try {
            const response = await motorService.bulkDeleteMotors(selectedIds);
            
            if (response.success) {
                await fetchMotors(); // Refresh data
                setSelectedIds([]);
                alert(`${response.deletedCount} motor berhasil dihapus!`);
            } else {
                throw new Error(response.message || 'Failed to delete motors');
            }
        } catch (error) {
            console.error('Error bulk deleting motors:', error);
            alert('Gagal menghapus motor: ' + error.message);
        }
    };

    // FIXED: Simplified button click handler
    const handleAddButtonClick = () => {
        console.log('Add button clicked!');
        console.log('showModal before:', showModal);
        openModal('add');
        console.log('showModal after openModal called');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            available: { class: 'status-available', text: 'Tersedia', icon: '🟢' },
            rented: { class: 'status-rented', text: 'Disewa', icon: '🔴' },
            maintenance: { class: 'status-maintenance', text: 'Maintenance', icon: '🟡' }
        };
        const config = statusConfig[status] || statusConfig.available;
        return (
            <span className={`status-badge ${config.class}`}>
                <span className="status-dot"></span>
                {config.text}
            </span>
        );
    };

    const formatPrice = (price) => {
        return `Rp ${parseFloat(price).toLocaleString('id-ID')}/hari`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getImageUrl = (imageName) => {
        return motorService.getImageUrl(imageName);
    };

    // FIXED: Debug modal state
    console.log('Current showModal state:', showModal);

    if (loading) {
        return (
            <div className="admin-layout">
                <Sidebar />
                <div className="admin-content">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <h3>Memuat Data Motor</h3>
                        <p>Mohon tunggu sebentar...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            
            <main className="admin-content">
                <div className="page-container">
                    {/* Page Header */}
                    <div className="page-header">
                        <div className="header-content">
                            <div className="header-text">
                                <h1 className="page-title">
                                    <div className="title-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                                        </svg>
                                    </div>
                                    Manajemen Motor
                                </h1>
                                <p className="page-subtitle">
                                    Kelola inventaris motor yang tersedia untuk disewa
                                </p>
                            </div>
                            <div className="header-actions">
                                <button 
                                    className="btn-primary"
                                    onClick={handleAddButtonClick}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Tambah Motor
                                </button>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="alert alert-error">
                                <div className="alert-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <div className="alert-content">
                                    <p>{error}</p>
                                </div>
                                <button 
                                    className="alert-close"
                                    onClick={() => setError(null)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stats Dashboard */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon stat-icon-primary">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L22 22H2L12 2Z"/>
                                    </svg>
                                </div>
                                <div className="stat-trend">
                                    <span className="trend-up">+12%</span>
                                </div>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{motorStats.total}</h3>
                                <p className="stat-label">Total Motor</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon stat-icon-success">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div className="stat-trend">
                                    <span className="trend-up">+8%</span>
                                </div>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{motorStats.available}</h3>
                                <p className="stat-label">Tersedia</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon stat-icon-warning">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 22h20L12 2z"/>
                                    </svg>
                                </div>
                                <div className="stat-trend">
                                    <span className="trend-down">-3%</span>
                                </div>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{motorStats.rented}</h3>
                                <p className="stat-label">Disewa</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon stat-icon-danger">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 22h20L12 2z"/>
                                    </svg>
                                </div>
                                <div className="stat-trend">
                                    <span className="trend-neutral">0%</span>
                                </div>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{motorStats.maintenance}</h3>
                                <p className="stat-label">Maintenance</p>
                            </div>
                        </div>
                    </div>



                    {/* Filters & Controls */}
                    <div className="controls-section">
                        <div className="search-filters">
                            <div className="search-box">
                                <div className="search-input-wrapper">
                                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan merk, tipe, atau spesifikasi..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    {searchTerm && (
                                        <button 
                                            className="search-clear"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="filter-group">
                                <div className="filter-item">
                                    <label>Merk</label>
                                    <select
                                        value={brandFilter}
                                        onChange={(e) => setBrandFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">Semua Merk</option>
                                        {getUniqueBrands().map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-item">
                                    <label>Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="available">Tersedia</option>
                                        <option value="rented">Disewa</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="view-controls">
                            <div className="view-toggle">
                                <button 
                                    className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    Grid
                                </button>
                                <button 
                                    className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <line x1="8" y1="6" x2="21" y2="6"></line>
                                        <line x1="8" y1="12" x2="21" y2="12"></line>
                                        <line x1="8" y1="18" x2="21" y2="18"></line>
                                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                    List
                                </button>
                            </div>

                            {selectedIds.length > 0 && (
                                <div className="bulk-actions">
                                    <span className="selected-count">{selectedIds.length} dipilih</span>
                                    <button 
                                        className="btn-danger-outline"
                                        onClick={handleBulkDelete}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                        </svg>
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="content-section">
                        {viewMode === 'grid' ? (
                            // Grid View
                            <div className="motor-grid">
                                {motorData.map((motor) => (
                                    <div key={motor.id} className="motor-card">
                                        <div className="card-header">
                                            <div className="card-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(motor.id)}
                                                    onChange={() => handleCheckboxChange(motor.id)}
                                                />
                                            </div>
                                            <div className="card-status">
                                                {getStatusBadge(motor.status)}
                                            </div>
                                        </div>

                                        <div className="card-image">
                                            {motor.image ? (
                                                <img 
                                                    src={getImageUrl(motor.image)} 
                                                    alt={`${motor.brand} ${motor.type}`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="image-placeholder" style={{display: motor.image ? 'none' : 'flex'}}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2L22 22H2L12 2Z"/>
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            <div className="motor-title">
                                                <h3>{motor.brand} {motor.type}</h3>
                                                <p className="motor-specs">{motor.specs}</p>
                                            </div>
                                            
                                            <div className="motor-description">
                                                <p>{motor.description}</p>
                                            </div>

                                            <div className="motor-price">
                                                <span className="price-amount">{formatPrice(motor.price)}</span>
                                            </div>

                                            <div className="motor-meta">
                                                <span className="meta-date">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                    {formatDate(motor.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-actions">
                                            <button 
                                                className="action-btn edit-btn"
                                                onClick={() => openModal('edit', motor)}
                                                title="Edit Motor"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                                Edit
                                            </button>
                                            <button 
                                                className="action-btn delete-btn"
                                                onClick={() => handleDelete(motor.id)}
                                                title="Hapus Motor"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3,6 5,6 21,6"></polyline>
                                                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                                </svg>
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // List View
                            <div className="motor-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th className="checkbox-col">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === motorData.length && motorData.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>Motor</th>
                                            <th>Spesifikasi</th>
                                            <th>Harga</th>
                                            <th>Status</th>
                                            <th>Tanggal</th>
                                            <th className="actions-col">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {motorData.map((motor) => (
                                            <tr key={motor.id} className={selectedIds.includes(motor.id) ? 'selected' : ''}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(motor.id)}
                                                        onChange={() => handleCheckboxChange(motor.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="table-motor-info">
                                                        <div className="table-motor-image">
                                                            {motor.image ? (
                                                                <img 
                                                                    src={getImageUrl(motor.image)} 
                                                                    alt={`${motor.brand} ${motor.type}`}
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className="table-image-placeholder" style={{display: motor.image ? 'none' : 'flex'}}>
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 2L22 22H2L12 2Z"/>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="table-motor-details">
                                                            <div className="motor-name">{motor.brand} {motor.type}</div>
                                                            <div className="motor-desc">{motor.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="specs-badge">{motor.specs}</span>
                                                </td>
                                                <td>
                                                    <span className="price-text">{formatPrice(motor.price)}</span>
                                                </td>
                                                <td>
                                                    {getStatusBadge(motor.status)}
                                                </td>
                                                <td>
                                                    <span className="date-text">{formatDate(motor.created_at)}</span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button 
                                                            className="action-btn-sm edit-btn"
                                                            onClick={() => openModal('edit', motor)}
                                                            title="Edit Motor">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="action-btn-sm delete-btn"
                                                            onClick={() => handleDelete(motor.id)}
                                                            title="Hapus Motor"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3,6 5,6 21,6"></polyline>
                                                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Empty State */}
                        {motorData.length === 0 && !loading && (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </div>
                                <h3>Tidak ada motor ditemukan</h3>
                                <p>
                                    {searchTerm || brandFilter !== 'all' || statusFilter !== 'all' 
                                        ? 'Coba ubah filter pencarian atau tambah motor baru.' 
                                        : 'Mulai dengan menambahkan motor pertama Anda.'
                                    }
                                </p>
                                <button 
                                    className="btn-primary"
                                    onClick={handleAddButtonClick}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Tambah Motor
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modalMode === 'add' ? 'Tambah Motor Baru' : 'Edit Motor'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="modal-form">
                            <div className="modal-body">
                                {error && (
                                    <div className="form-error">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Merk Motor <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Contoh: Honda, Yamaha, Suzuki"
                                            value={formData.brand}
                                            onChange={(e) => setFormData({...formData, brand: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Tipe Motor <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Contoh: Vario 125, NMAX, Satria"
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Harga Sewa (Per Hari) <span className="required">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-prefix">Rp</span>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="150000"
                                                value={formData.price}
                                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                                min="0"
                                                step="1000"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        >
                                            <option value="available">Tersedia</option>
                                            <option value="rented">Disewa</option>
                                            <option value="maintenance">Maintenance</option>
                                        </select>
                                    </div>

                                    <div className="form-group form-group-full">
                                        <label className="form-label">Spesifikasi</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Contoh: 125cc, Manual, Injeksi"
                                            value={formData.specs}
                                            onChange={(e) => setFormData({...formData, specs: e.target.value})}
                                        />
                                    </div>

                                    <div className="form-group form-group-full">
                                        <label className="form-label">Deskripsi</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Deskripsi singkat tentang motor..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group form-group-full">
                                        <label className="form-label">Foto Motor</label>
                                        <div className="file-upload">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                                                id="motor-image"
                                                className="file-input"
                                            />
                                            <label htmlFor="motor-image" className="file-label">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21,15 16,10 5,21"></polyline>
                                                </svg>
                                                <span>Pilih foto motor</span>
                                            </label>
                                            {formData.image && (
                                                <div className="file-preview">
                                                    <span className="file-name">{formData.image.name}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({...formData, image: null})}
                                                        className="file-remove"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={closeModal}
                                    disabled={submitLoading}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? (
                                        <>
                                            <div className="loading-spinner-sm"></div>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17,21 17,13 7,13 7,21"></polyline>
                                                <polyline points="7,3 7,8 15,8"></polyline>
                                            </svg>
                                            {modalMode === 'add' ? 'Tambah Motor' : 'Simpan Perubahan'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Motor;