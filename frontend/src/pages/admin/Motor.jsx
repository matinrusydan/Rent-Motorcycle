// frontend/src/pages/Motor.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar.jsx';
import motorService from '../../services/motorService.js';
import '../../assets/css/admin/sidebar.css';
import '../../assets/css/global.css';
import '../../assets/css/admin/motor.css'; // ✅ Impor CSS yang sama

const Motor = () => {
    // State Management
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
    const [viewMode, setViewMode] = useState('grid'); // Tetap dipertahankan
    const [formData, setFormData] = useState({
        brand: '',
        type: '',
        price: '',
        specs: '',
        status: 'available',
        description: '',
        image: null
    });

    // Helper Functions
    const resetFormData = () => {
        setFormData({
            brand: '',
            type: '',
            price: '',
            specs: '',
            status: 'available',
            description: '',
            image: null
        });
    };

    const getUniqueBrands = () => {
        const brands = [...new Set(motorData.map(motor => motor.brand))];
        return brands.filter(brand => brand);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            available: { class: 'status-approved', text: 'Tersedia' }, //
            rented: { class: 'status-rejected', text: 'Disewa' }, //
            maintenance: { class: 'status-pending', text: 'Maintenance' } //
        };
        const config = statusConfig[status] || statusConfig.available;
        return (
            <span className={`badge ${config.class}`}> {/* */}
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

    // Data Fetching
    const fetchMotors = useCallback(async () => {
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

    // Event Handlers
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

    const openModal = (mode, motor = null) => {
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
            resetFormData();
        }
        
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setCurrentMotor(null);
        resetFormData();
        setError(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // DEBUG: Log semua data sebelum dikirim
        console.log('FormData state:', formData);
        console.log('Brand value:', formData.brand);
        console.log('Type value:', formData.type);
        console.log('Price value:', formData.price);
        
        // Validation
        if (!formData.brand || !formData.type || !formData.price) {
            console.log('Validation failed - missing required fields');
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

            const motorDataToSend = new FormData();
            
            // DEBUG: Log setiap append
            console.log('Appending brand:', formData.brand);
            motorDataToSend.append('brand', formData.brand);
            
            console.log('Appending type:', formData.type);
            motorDataToSend.append('type', formData.type);
            
            console.log('Appending price:', parseFloat(formData.price));
            motorDataToSend.append('price', parseFloat(formData.price));
            
            motorDataToSend.append('specs', formData.specs);
            motorDataToSend.append('status', formData.status);
            motorDataToSend.append('description', formData.description);
            
            if (formData.image) {
                console.log('Appending image:', formData.image.name);
                motorDataToSend.append('gambar_motor', formData.image); // ✅ Ganti ke gambar_motor
            }


            // DEBUG: Log FormData contents
            console.log('FormData entries:');
            for (let [key, value] of motorDataToSend.entries()) {
                console.log(key, value);
            }

            let response;
            if (modalMode === 'add') {
                console.log('Calling createMotor...');
                response = await motorService.createMotor(motorDataToSend);
            } else {
                response = await motorService.updateMotor(currentMotor.id, motorDataToSend);
            }

            console.log('API Response:', response);

            if (response.success) {
                await fetchMotors();
                closeModal();
                alert(modalMode === 'add' ? 'Motor berhasil ditambahkan!' : 'Motor berhasil diperbarui!');
            } else {
                throw new Error(response.message || 'Failed to save motor');
            }
        } catch (error) {
            console.error('Error saving motor:', error);
            console.error('Error details:', error.message);
            setError('Gagal menyimpan motor: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus motor ini?')) {
            return;
        }

        try {
            const response = await motorService.deleteMotor(id);
            
            if (response.success) {
                await fetchMotors();
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

        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} motor yang dipilih?`)) {
            return;
        }

        try {
            const response = await motorService.bulkDeleteMotors(selectedIds);
            
            if (response.success) {
                await fetchMotors();
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

    // Loading State
    if (loading) {
        return (
            <div className="admin-layout">
                <Sidebar />
                <div id="content-wrapper" className="d-flex flex-column"> {/* */}
                    <div id="content"> {/* */}
                        <div className="loading-container"> {/* */}
                            <div className="loading-spinner"></div>
                            <p>Memuat Data Motor...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Render
    return (
        <div className="admin-layout">
            <Sidebar />
            
            <div id="content-wrapper" className="d-flex flex-column"> {/* */}
                <div id="content"> {/* */}
                    <div className="container-fluid"> {/* */}
                        <div className="pembayaran-wrapper"> {/* */}

                            {/* Page Header */}
                            <div className="page-header"> {/* */}
                                <div className="header-icon">🏍️</div> {/* */}
                                <h1 className="page-title">Manajemen Motor</h1> {/* */}
                                <p className="page-subtitle">Kelola inventaris motor yang tersedia untuk disewa</p> {/* */}
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="error-alert" style={{ marginBottom: '20px' }}>
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                    <button className="error-close" onClick={() => setError(null)}>✖️</button>
                                </div>
                            )}
                            
                            {/* Stats Dashboard */}
                            <div className="stats-grid"> {/* */}
                                <div className="stat-card"> {/* */}
                                    <div className="stat-icon">📊</div> {/* */}
                                    <div className="stat-info"> {/* */}
                                        <div className="stat-number">{motorStats.total}</div> {/* */}
                                        <div className="stat-label">Total Motor</div> {/* */}
                                    </div>
                                </div>

                                <div className="stat-card"> {/* */}
                                    <div className="stat-icon">✅</div> {/* */}
                                    <div className="stat-info"> {/* */}
                                        <div className="stat-number">{motorStats.available}</div> {/* */}
                                        <div className="stat-label">Tersedia</div> {/* */}
                                    </div>
                                </div>

                                <div className="stat-card"> {/* */}
                                    <div className="stat-icon">RENT</div> {/* */}
                                    <div className="stat-info"> {/* */}
                                        <div className="stat-number">{motorStats.rented}</div> {/* */}
                                        <div className="stat-label">Disewa</div> {/* */}
                                    </div>
                                </div>

                                <div className="stat-card"> {/* */}
                                    <div className="stat-icon">🔧</div> {/* */}
                                    <div className="stat-info"> {/* */}
                                        <div className="stat-number">{motorStats.maintenance}</div> {/* */}
                                        <div className="stat-label">Maintenance</div> {/* */}
                                    </div>
                                </div>
                            </div>

                            {/* Admin Controls */}
                            <div className="card shadow mb-4"> 
                                <div className="card-body"> 
                                    <div className="admin-controls"> 
                                        <div className="search-group">
                                            <input
                                                type="text"
                                                placeholder="Cari motor..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="form-control" 
                                            />
                                        </div>

                                        <div className="filter-group"> {/* */}
                                            <select
                                                value={brandFilter}
                                                onChange={(e) => setBrandFilter(e.target.value)}
                                                className="form-select" 
                                            >
                                                <option value="all">Semua Merk</option>
                                                {getUniqueBrands().map(brand => (
                                                    <option key={brand} value={brand}>{brand}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="filter-group"> {/* */}
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="form-select" 
                                            >
                                                <option value="all">Semua Status</option>
                                                <option value="available">Tersedia</option>
                                                <option value="maintenance">Maintenance</option>
                                            </select>
                                        </div>

                                        {/* Tombol Add Motor */}
                                        <button
                                            className="btn btn-primary" 
                                            onClick={() => openModal('add')}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            Tambah Motor
                                        </button>
                                    </div>

                                    {/* View Toggle dan Bulk Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                                        <div className="view-toggle" style={{ display: 'flex' }}> {/* Menambahkan display flex di inline style */}
                                            <button 
                                                className={`btn btn-secondary ${viewMode === 'grid' ? 'active' : ''}`} 
                                                onClick={() => setViewMode('grid')}
                                            >
                                                Grid
                                            </button>
                                            <button 
                                                className={`btn btn-secondary ${viewMode === 'list' ? 'active' : ''}`} 
                                                onClick={() => setViewMode('list')}
                                            >
                                                List
                                            </button>
                                        </div>

                                        {selectedIds.length > 0 && (
                                            <div className="bulk-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> {/* Menambahkan inline style */}
                                                <span className="selected-count" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', fontWeight: '500' }}>{selectedIds.length} dipilih</span> {/* Inline style */}
                                                <button 
                                                    className="btn btn-danger" 
                                                    onClick={handleBulkDelete}
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content Section (mengadaptasi dari Pembayaran.jsx) */}
                            <div className="card shadow mb-4"> {/* */}
                                <div className="card-header py-3"> {/* */}
                                    <h6 className="m-0 font-weight-bold text-primary"> {/* */}
                                        {viewMode === 'grid' ? 'Motor dalam Tampilan Grid' : 'Motor dalam Tampilan Daftar'}
                                    </h6>
                                    <div className="card-subtitle">
                                        Menampilkan {motorData.length} motor
                                    </div>
                                </div>
                                <div className="card-body"> {/* */}
                                    {motorData.length === 0 ? (
                                        <div className="empty-state"> {/* */}
                                            <div className="empty-icon">🤷‍♂️</div> {/* */}
                                            <h3>Tidak ada motor ditemukan</h3> {/* */}
                                            <p> {/* */}
                                                {searchTerm || brandFilter !== 'all' || statusFilter !== 'all' 
                                                    ? 'Coba ubah filter pencarian atau tambah motor baru.' 
                                                    : 'Mulai dengan menambahkan motor pertama Anda.'
                                                }
                                            </p>
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={() => openModal('add')}
                                            >
                                                Tambah Motor
                                            </button>
                                        </div>
                                    ) : viewMode === 'grid' ? (
                                        // Grid View (adaptasi card motor agar sesuai)
                                        <div className="motor-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}> {/* Inline style untuk grid */}
                                            {motorData.map((motor) => (
                                                <div key={motor.id} className="card"> {/* Menggunakan class card */}
                                                    <div className="card-header py-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> {/* */}
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(motor.id)}
                                                            onChange={() => handleCheckboxChange(motor.id)}
                                                        />
                                                        {getStatusBadge(motor.status)}
                                                    </div>
                                                    <div className="card-body" style={{ textAlign: 'center' }}> {/* */}
                                                        <div className="motor-image-wrapper" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                                                            {motor.gambar_motor ? (
                                                            <img 
                                                                src={getImageUrl(motor.gambar_motor)} 
                                                                alt={`${motor.brand} ${motor.type}`}
                                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                                onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                            ) : null}
                                                        </div>
                                                        <h5 className="motor-name" style={{ fontWeight: '600', color: 'var(--dark-color)', fontSize: 'var(--font-size-base)', marginBottom: '0.25rem' }}>{motor.brand} {motor.type}</h5> {/* Inline style */}
                                                        <p className="motor-specs" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{motor.specs}</p> {/* Inline style */}
                                                        <p className="motor-description" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', margin: '0.5rem 0' }}>{motor.description}</p> {/* Inline style */}
                                                        <div className="amount" style={{ margin: '1rem 0', fontWeight: '700', color: 'var(--success-color)', fontSize: 'var(--font-size-lg)' }}>{formatPrice(motor.price)}</div> {/* Inline style */}
                                                        <div className="customer-phone" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>Dibuat: {formatDate(motor.created_at)}</div> {/* Inline style */}
                                                    </div>
                                                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-around', padding: '1rem', borderTop: '1px solid var(--gray-200)', background: 'var(--gray-50)', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}> {/* Menggunakan card-footer dan inline style */}
                                                        <button 
                                                            className="btn btn-secondary btn-sm" 
                                                            onClick={() => openModal('edit', motor)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="btn btn-danger btn-sm" 
                                                            onClick={() => handleDelete(motor.id)}
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // List View (mengadaptasi table pembayaranadmin.css)
                                        <div className="table-responsive"> {/* */}
                                            <table className="table table-bordered" width="100%" cellSpacing="0"> {/* */}
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
                                                        <th>Tanggal Dibuat</th>
                                                        <th>Aksi</th>
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
                                                                <div className="customer-info"> {/* */}
                                                                    <div className="customer-name">{motor.brand} {motor.type}</div> {/* */}
                                                                    <div className="customer-phone">{motor.description}</div> {/* */}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="motor-duration" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{motor.specs}</span> {/* Inline style */}
                                                            </td>
                                                            <td>
                                                                <span className="amount">{formatPrice(motor.price)}</span> {/* */}
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(motor.status)}
                                                            </td>
                                                            <td>
                                                                <span className="customer-phone" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>{formatDate(motor.created_at)}</span> {/* Inline style */}
                                                            </td>
                                                            <td>
                                                                <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}> {/* Inline style */}
                                                                    <button 
                                                                        className="btn btn-info btn-sm" 
                                                                        onClick={() => openModal('edit', motor)}
                                                                        title="Edit Motor"
                                                                    >
                                                                        ✏️ Edit
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-danger btn-sm" 
                                                                        onClick={() => handleDelete(motor.id)}
                                                                        title="Hapus Motor"
                                                                    >
                                                                        🗑️ Hapus
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Admin (Disalin dari PembayaranAdmin.jsx) */}
                <footer className="sticky-footer bg-white"> {/* */}
                    <div className="container my-auto"> {/* */}
                        <div className="copyright text-center my-auto"> {/* */}
                            <span>Copyright &copy; Motor Rental 2024</span> {/* */}
                        </div>
                    </div>
                </footer>
            </div>

            {/* Modal (menggunakan gaya popup dari pembayaranadmin.css) */}
            {showModal && (
                <div className={`popup-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}> {/* */}
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}> {/* */}
                        <div className="popup-header"> {/* */}
                            <h3>{modalMode === 'add' ? 'Tambah Motor Baru' : 'Edit Motor'}</h3> {/* */}
                            <button className="close-btn" onClick={closeModal}> {/* */}
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="popup-body"> {/* */}
                            {error && (
                                <div className="error-alert" style={{ marginBottom: '1.5rem' }}> {/* */}
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                    <button className="error-close" onClick={() => setError(null)}>✖️</button>
                                </div>
                            )}

                            <div className="detail-grid"> {/* */}
                                <div className="form-group"> {/* */}
                                    <label htmlFor="brand">Brand *</label> {/* */}
                                    <input
                                        type="text"
                                        id="brand"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                                        placeholder="Masukkan brand motor"
                                        className="form-control" 
                                        required
                                    />
                                </div>

                                <div className="form-group"> {/* */}
                                    <label htmlFor="type">Tipe *</label> {/* */}
                                    <input
                                        type="text"
                                        id="type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        placeholder="Masukkan tipe motor"
                                        className="form-control" 
                                        required
                                    />
                                </div>

                                <div className="form-group"> {/* */}
                                    <label htmlFor="price">Harga per Hari *</label> {/* */}
                                    <input
                                        type="number"
                                        id="price"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        placeholder="Masukkan harga"
                                        min="0"
                                        step="1000"
                                        className="form-control"
                                        required
                                    />
                                </div>

                                <div className="form-group"> {/* */}
                                    <label htmlFor="status">Status</label> {/* */}
                                    <select
                                        id="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="form-select" 
                                    >
                                        <option value="available">Tersedia</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}> {/* */}
                                    <label htmlFor="specs">Spesifikasi</label> {/* */}
                                    <input
                                        type="text"
                                        id="specs"
                                        value={formData.specs}
                                        onChange={(e) => setFormData({...formData, specs: e.target.value})}
                                        placeholder="Masukkan spesifikasi motor"
                                        className="form-control"
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}> {/* */}
                                    <label htmlFor="description">Deskripsi</label> {/* */}
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Masukkan deskripsi motor"
                                        rows="3"
                                        className="form-control" 
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}> {/* */}
                                    <label htmlFor="image">Gambar Motor</label> {/* */}
                                    <div className="file-upload-area"> {/* */}
                                        <input
                                            type="file"
                                            id="image"
                                            accept="image/*"
                                            onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="image" className="upload-placeholder" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '2px dashed var(--gray-300)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                            <div className="upload-icon">📁</div> {/* */}
                                            <div className="upload-text"> {/* */}
                                                <strong>Klik untuk pilih file</strong> atau drag & drop di sini
                                            </div>
                                            <div className="upload-note">JPG, PNG, GIF (Max. 5MB)</div> {/* */}
                                            {formData.image && (
                                                <div className="upload-success" style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}> {/* */}
                                                    <div className="success-icon">✅</div> {/* */}
                                                    <div className="success-text">{formData.image.name}</div> {/* */}
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="popup-footer"> {/* */}
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
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
                                    {submitLoading ? (
                                        <>
                                            <span className="spinner"></span> {/* */}
                                            {modalMode === 'add' ? 'Menambahkan...' : 'Memperbarui...'}
                                        </>
                                    ) : (
                                        modalMode === 'add' ? 'Tambah Motor' : 'Simpan Perubahan'
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