// backend/middlewares/multerMiddleware.js (VERIFIKASI FILE INI!)
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
        // ✅ Perhatikan logika ini: Tentukan sub-folder berdasarkan fieldname
        if (file.fieldname === 'foto_ktp') {
            destFolder = path.join(uploadDir, 'ktp');
        } else if (file.fieldname === 'gambar_motor') { // ✅ Pastikan ini ada untuk motor
            destFolder = path.join(uploadDir, 'motors'); // Folder khusus untuk gambar motor
        } else if (file.fieldname === 'bukti_transfer') {
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
            filenamePrefix = 'MOTOR'; // ✅ Prefix untuk nama file gambar motor
        } else if (file.fieldname === 'bukti_transfer') {
            filenamePrefix = 'BUKTI_BAYAR';
        }

        cb(null, filenamePrefix + '_' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    // Jika fieldnya gambar_motor, PDF tidak diizinkan
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

module.exports = upload;