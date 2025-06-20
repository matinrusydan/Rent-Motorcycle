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
        openModal('add');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            available: { class: 'status-available', text: 'Tersedia', icon: '✅' },
            rented: { class: 'status-rented', text: 'Disewa', icon: '🚗' },
            maintenance: { class: 'status-maintenance', text: 'Maintenance', icon: '🔧' }
        };
        const config = statusConfig[status] || statusConfig.available;
        return (
            <span className={`status-badge ${config.class}`}>
                {config.icon} {config.text}
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
                    {/* Topbar */}
                    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                        <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3" onClick={handleSidebarToggle}>
                            <i className="fa fa-bars"></i>
                        </button>
                        
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item dropdown no-arrow">
                                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <span className="mr-2 d-none d-lg-inline text-gray-600 small">Admin</span>
                                    <img className="img-profile rounded-circle"
                                        src="http://via.placeholder.com/40x40" alt="Profile" />
                                </a>
                                <div className="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                                    aria-labelledby="userDropdown">
                                    <Link className="dropdown-item" to="/admin/settings">
                                        <i className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Settings
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">
                                        <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                                        Logout
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </nav>
                    {/* End of Topbar */}
                    
                    <div className="loading-container">
                        <div className="loading-spinner">⏳</div>
                        <p>Memuat data motor...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            
            <main className="admin-content">
                {/* Topbar */}
                <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                    <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3" onClick={handleSidebarToggle}>
                        <i className="fa fa-bars"></i>
                    </button>
                    
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item dropdown no-arrow">
                            <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="mr-2 d-none d-lg-inline text-gray-600 small">Admin</span>
                                <img className="img-profile rounded-circle"
                                    src="http://via.placeholder.com/40x40" alt="Profile" />
                            </a>
                            <div className="dropdown-menu dropdown-menu-right shadow animated--grow-in"
                                aria-labelledby="userDropdown">
                                <Link className="dropdown-item" to="/admin/settings">
                                    <i className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                                    Settings
                                </Link>
                                <div className="dropdown-divider"></div>
                                <a className="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">
                                    <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                                    Logout
                                </a>
                            </div>
                        </li>
                    </ul>
                </nav>
                {/* End of Topbar */}

                <div className="motor-container">
                    {error && (
                        <div className="error-alert">
                            <span className="error-icon">⚠️</span>
                            {error}
                            <button 
                                className="error-close"
                                onClick={() => setError(null)}
                            >
                                ✖️
                            </button>
                        </div>
                    )}

                    <div className="motor-header">
                        <div className="header-left">
                            <h1 className="motor-title">
                                <span className="title-icon">🏍️</span>
                                Manajemen Motor
                            </h1>
                            <p className="motor-subtitle">
                                Kelola data motor yang tersedia untuk disewa
                            </p>
                        </div>
                        <div className="header-right">
                            {/* FIXED: Simplified button */}
                            <button 
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddButtonClick}
                            >
                                ➕ Tambah Motor
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="motor-stats">
                        <div className="stat-card">
                            <div className="stat-icon">🏍️</div>
                            <div className="stat-info">
                                <h3>{motorStats.total}</h3>
                                <p>Total Motor</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <h3>{motorStats.available}</h3>
                                <p>Tersedia</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🚗</div>
                            <div className="stat-info">
                                <h3>{motorStats.rented}</h3>
                                <p>Disewa</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔧</div>
                            <div className="stat-info">
                                <h3>{motorStats.maintenance}</h3>
                                <p>Maintenance</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="motor-filters">
                        <div className="filter-group">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan merk, tipe, atau spesifikasi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <span className="search-icon">🔍</span>
                            </div>
                            
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

                        <div className="bulk-actions">
                            <button 
                                className="btn btn-danger"
                                onClick={handleBulkDelete}
                                disabled={selectedIds.length === 0}
                            >
                                🗑️ Hapus Terpilih ({selectedIds.length})
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="motor-table-container">
                        <table className="motor-table">
                            <thead>
                                <tr>
                                    <th>
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
                                    <th>Tanggal Ditambah</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {motorData.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => handleCheckboxChange(item.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="motor-info">
                                                <div className="motor-image">
                                                    {item.image ? (
                                                        <img 
                                                            src={getImageUrl(item.image)} 
                                                            alt={`${item.brand} ${item.type}`}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="motor-placeholder" style={{display: item.image ? 'none' : 'block'}}>
                                                        🏍️
                                                    </div>
                                                </div>
                                                <div className="motor-details">
                                                    <strong>{item.brand} {item.type}</strong>
                                                    <p>{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="specs-text">{item.specs}</span>
                                        </td>
                                        <td>
                                            <span className="price-text">{formatPrice(item.price)}</span>
                                        </td>
                                        <td>
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td>
                                            <span className="date-text">{formatDate(item.created_at)}</span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => openModal('edit', item)}
                                                    title="Edit Motor"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Hapus Motor"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {motorData.length === 0 && !loading && (
                            <div className="empty-state">
                                <div className="empty-icon">🏍️</div>
                                <h3>Tidak ada motor ditemukan</h3>
                                <p>Coba ubah filter pencarian atau tambah motor baru</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* FIXED: Modal - Always render when showModal is true */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? 'Tambah Motor Baru' : 'Edit Motor'}</h3>
                            <button className="modal-close" onClick={closeModal} type="button">
                                ✖️
                            </button>
                        </div>
                        
                        {error && (
                            <div className="modal-error">
                                <span className="error-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="brand">Merk Motor *</label>
                                    <select
                                        id="brand"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                                        required
                                    >
                                        <option value="">Pilih Merk</option>
                                        <option value="Honda">Honda</option>
                                        <option value="Yamaha">Yamaha</option>
                                        <option value="Suzuki">Suzuki</option>
                                        <option value="Kawasaki">Kawasaki</option>
                                        <option value="TVS">TVS</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="type">Tipe Motor *</label>
                                    <input
                                        type="text"
                                        id="type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        placeholder="Contoh: Beat, Vario, NMAX"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="price">Harga Sewa (per hari) *</label>
                                    <input
                                        type="number"
                                        id="price"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        placeholder="80000"
                                        min="1"
                                        step="1000"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        required
                                    >
                                        <option value="available">Tersedia</option>
                                        <option value="rented">Disewa</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="specs">Spesifikasi</label>
                                <input
                                    type="text"
                                    id="specs"
                                    value={formData.specs}
                                    onChange={(e) => setFormData({...formData, specs: e.target.value})}
                                    placeholder="110cc • Matic • Hemat BBM"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Deskripsi</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Deskripsi singkat tentang motor"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="image">Gambar Motor</label>
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                                />
                                <small className="form-text">Format: JPG, PNG, maksimal 5MB</small>
                                {modalMode === 'edit' && currentMotor?.image && (
                                    <div className="current-image">
                                        <small>Gambar saat ini:</small>
                                        <img 
                                            src={getImageUrl(currentMotor.image)} 
                                            alt="Current"
                                            style={{maxWidth: '100px', maxHeight: '100px', objectFit: 'cover'}}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn btn-cancel" 
                                    onClick={closeModal}
                                    disabled={submitLoading}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? 'Menyimpan...' : (modalMode === 'add' ? 'Tambah Motor' : 'Simpan Perubahan')}
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