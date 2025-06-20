// backend/hashPassword.js
const bcrypt = require('bcryptjs');

async function hashAndLogPassword(password) {
    const salt = await bcrypt.genSalt(10); // Gunakan salt yang sama dengan yang di authController
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`Password original: ${password}`);
    console.log(`Password hashed: ${hashedPassword}`);
}

hashAndLogPassword('admin123'); // Ganti 'admin123' jika Anda ingin password lain