const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const credentialGCS = require('../config/credentialGCS.json');

const storage = new Storage({
  credentials: credentialGCS,
  projectId: 'wisma-rapsodi-musik',
});

const profileBucket = storage.bucket('wmr');

const moduleBucket = storage.bucket('wmr');

const multerStorage = multer.memoryStorage();

const profilePictureFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  const allowedMime = /^image\//;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMime.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif, webp)!'));
  }
};

const moduleFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|ppt|pptx|mp4|mov|avi)$/i;
  const allowedMime = /^(image\/|application\/pdf|application\/msword|application\/vnd\.|video\/)/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMime.test(file.mimetype);

  // console.log('File extension:', path.extname(file.originalname).toLowerCase());
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan: gambar, PDF, dokumen Office, atau video!'));
  }
};

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: profilePictureFilter,
});

const uploadModule = multer({
  storage: multerStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: moduleFilter,
});


const uploadToGCS = async (file, folder, personName = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File tidak ditemukan'));
      return;
    }

    const bucket = folder === 'modules' ? moduleBucket : profileBucket;

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

    let bucket;
    if (fileUrl.includes('wmr')) {
      if (fileUrl.includes('/modules/')) {
        bucket = moduleBucket;
      } else {
        bucket = profileBucket;
      }
    } else {
      bucket = profileBucket; 
    }

    const fileName = fileUrl.split(`${bucket.name}/`)[1];
    if (!fileName) return false;

    await bucket.file(fileName).delete();
    console.log(`File ${fileName} berhasil dihapus dari GCS`);
    return true;
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadModule,
  uploadToGCS,
  deleteFromGCS,
};

