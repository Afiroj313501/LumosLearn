import multer from 'multer';
import crypto from 'crypto';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.zip', '.png', '.jpg', '.jpeg'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop();
    return {
      folder: 'lumenlearner_uploads',
      resource_type: 'raw',
      public_id: `${Date.now()}-${crypto.randomUUID()}`,
      format: ext,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PPT/PPTX, DOC/DOCX, ZIP, and image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export default upload;