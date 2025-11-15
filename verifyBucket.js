const { Storage } = require('@google-cloud/storage');
const path = require('path');

const credentialsPath = path.join('./credentialGCS.json'); 

// Inisialisasi Storage dengan path kredensial eksplisit untuk memastikan
const storage = new Storage({
  keyFilename: credentialsPath,
  projectId: 'wisma-rapsodi-musik',
});

const bucketName = 'wmr_profille_picture';

async function verifyBucket() {
  try {
    const [exists] = await storage.bucket(bucketName).exists();
  } catch (error) {
    console.error('Terjadi error saat berkomunikasi dengan Google Cloud Storage:');
    console.error(error);
  }
}

verifyBucket();