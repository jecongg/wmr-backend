// File: checkBucket.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// =========================================================================
// PENTING: Gunakan path absolut ke file kredensial Anda untuk tes ini
// Ganti dengan path yang benar di komputer Anda
// =========================================================================
const credentialsPath = path.join('./credentialGCS.json'); // Sesuaikan path ini jika perlu

// Inisialisasi Storage dengan path kredensial eksplisit untuk memastikan
const storage = new Storage({
  keyFilename: credentialsPath,
  projectId: 'wisma-rapsodi-musik',
});

const bucketName = 'wmr_profille_picture';

async function verifyBucket() {
  try {
    console.log(`Mencoba memeriksa keberadaan bucket: "${bucketName}"...`);
    
    const [exists] = await storage.bucket(bucketName).exists();
    
    if (exists) {
      console.log(`✅ SUKSES: Bucket "${bucketName}" ditemukan!`);
    } else {
      console.error(`❌ GAGAL: Bucket "${bucketName}" TIDAK ditemukan.`);
      console.log('Pastikan nama bucket sudah benar dan kredensial memiliki izin yang sesuai.');
    }
  } catch (error) {
    console.error('Terjadi error saat berkomunikasi dengan Google Cloud Storage:');
    console.error(error);
  }
}

verifyBucket();