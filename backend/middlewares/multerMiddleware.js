// backend/middlewares/multerMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destFolder;
        if (file.fieldname === 'foto_ktp') {
            destFolder = path.join(uploadDir, 'ktp');
        } else if (file.fieldname === 'gambar_motor') {
            destFolder = path.join(uploadDir, 'motor_images'); // Menggunakan 'motor_images' sesuai dengan server.js static
        } else if (file.fieldname === 'buktiPembayaran') {
            destFolder = path.join(uploadDir, 'pembayaran');
        } else {
            destFolder = path.join(uploadDir, 'misc');
        }
        
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true });
        }
        cb(null, destFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let filenamePrefix = file.fieldname.toUpperCase();
        
        if (file.fieldname === 'foto_ktp') {
            filenamePrefix = 'KTP';
        } else if (file.fieldname === 'gambar_motor') {
            filenamePrefix = 'MOTOR';
        } else if (file.fieldname === 'buktiPembayaran') {
            filenamePrefix = 'BUKTI_BAYAR';
        }

        cb(null, filenamePrefix + '_' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (file.fieldname === 'gambar_motor' && file.mimetype === 'application/pdf') {
        cb(new Error('Untuk gambar motor, hanya file gambar (JPEG, JPG, PNG) yang diizinkan!'), false);
    } else if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar (JPEG, JPG, PNG) atau PDF yang diperbolehkan!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Modifikasi ini untuk mengembalikan path yang benar
// Ini adalah objek multer yang akan digunakan di rute
const uploadMiddleware = {
    single: (fieldName) => (req, res, next) => {
        const uploader = upload.single(fieldName);
        uploader(req, res, (err) => {
            if (err) {
                return next(err);
            }
            // Setelah upload selesai, modifikasi req.file.path
            if (req.file) {
                // Ambil path relatif dari folder 'uploads'
                const relativePath = path.relative(uploadDir, req.file.path).replace(/\\/g, '/');
                req.file.path = `uploads/${relativePath}`; // Simpan path yang diinginkan
            }
            next();
        });
    },
    // ...
};


module.exports = uploadMiddleware; 