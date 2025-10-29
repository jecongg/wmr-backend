const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const credentialGCS = require('../config/credentialGCS.json');

const storage = new Storage({
  credentials: credentialGCS,
  projectId: 'wisma-rapsodi-musik',
});

const bucket = storage.bucket('wmr_profille_picture');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif, webp)!'));
  }
};

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: multerFilter,
});


const uploadToGCS = async (file, folder, personName = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File tidak ditemukan'));
      return;
    }

    const timestamp = Date.now();
    
    let baseName;
    if (personName) {
      baseName = personName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-') 
        .replace(/-+/g, '-'); 
    } else {
      baseName = file.originalname.replace(/\s+/g, '-');
    }
    
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${timestamp}-${baseName}${fileExt}`;

    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error('Error uploading to GCS:', error);
      reject(error);
    });


    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};


const deleteFromGCS = async (fileUrl) => {
  try {
    if (!fileUrl) return false;

    const fileName = fileUrl.split(`${bucket.name}/`)[1];
    if (!fileName) return false;

    await bucket.file(fileName).delete();
    // console.log(`File ${fileName} berhasil dihapus dari GCS`);
    return true;
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadToGCS,
  deleteFromGCS,
};

