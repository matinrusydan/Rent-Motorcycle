class MotorService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // ✅ Fixed: Change from '/motors' to '/admin/motors' to match backend route
        this.endpoint = `${this.baseURL}/admin/motors`;
    }

    // Get authentication token from localStorage
    getAuthToken() {
        return localStorage.getItem('token');
    }

    // Helper method for making API requests
    async makeRequest(url, options = {}) {
        try {
            const token = this.getAuthToken();
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Redirect to login page
                    window.location.href = '/login';
                    return;
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Get all motors with optional filters
    async getAllMotors(filters = {}) {
        const queryParams = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key] !== '' && filters[key] !== 'all') {
                queryParams.append(key, filters[key]);
            }
        });

        const url = queryParams.toString() 
            ? `${this.endpoint}?${queryParams.toString()}`
            : this.endpoint;

        return await this.makeRequest(url);
    }

    // Get single motor by ID
    async getMotorById(id) {
        return await this.makeRequest(`${this.endpoint}/${id}`);
    }

    // Create new motor
    async createMotor(motorData) {
        const formData = new FormData();
        
        Object.keys(motorData).forEach(key => {
            if (motorData[key] !== null && motorData[key] !== undefined) {
                formData.append(key, motorData[key]);
            }
        });

        return await this.makeRequest(this.endpoint, {
            method: 'POST',
            body: formData
        });
    }

    // Update motor
    async updateMotor(id, motorData) {
        const formData = new FormData();
        
        Object.keys(motorData).forEach(key => {
            if (motorData[key] !== null && motorData[key] !== undefined) {
                formData.append(key, motorData[key]);
            }
        });

        return await this.makeRequest(`${this.endpoint}/${id}`, {
            method: 'PUT',
            body: formData
        });
    }

    // Delete motor
    async deleteMotor(id) {
        return await this.makeRequest(`${this.endpoint}/${id}`, {
            method: 'DELETE'
        });
    }

    // Bulk delete motors
    async bulkDeleteMotors(ids) {
        return await this.makeRequest(`${this.endpoint}/bulk-delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids })
        });
    }

    // Get motor statistics
    async getMotorStats() {
        return await this.makeRequest(`${this.endpoint}/stats`);
    }

    // Helper method to get image URL
    getImageUrl(imageName) {
        if (!imageName) return null;
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseURL}/uploads/${imageName}`;
    }
}

// Create singleton instance
const motorService = new MotorService();

export default motorService;