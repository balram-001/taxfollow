import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getPublicTasks,
  uploadClientDocument,
  deleteClientDocumentFile,
  uploadFinalAcknowledgement,
  updateTaskStatus,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Public Tracking & Client File Upload Routes
router.get('/public/:token', getPublicTasks);
router.post('/upload/:token', upload.array('files', 10), uploadClientDocument);
router.delete('/upload/:token/file/:taskId/:fileIndex', deleteClientDocumentFile);

// CA Dashboard Routes
router.post('/ca-upload-ack/:clientId', protect, upload.single('file'), uploadFinalAcknowledgement);
router.put('/:id', protect, updateTaskStatus);

export default router;