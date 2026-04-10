const express = require('express');
const multer = require('multer');
const supabase = require('../../config/supabase');
require('dotenv').config();

const router = express.Router();

// Use memory storage — we read the file buffer and upload it to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload/image
 * Body: multipart/form-data with field "image"
 * Query: ?bucket=menu-images (optional, defaults to "menu-images")
 * Returns: { success: true, url: "https://..." }
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const bucket = req.query.bucket || 'menu-images';
    const folder = req.query.folder || 'uploads';
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image to storage', details: error.message });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    return res.json({ success: true, url: publicUrl, path: filename });
  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({ error: 'Image upload failed', details: err.message });
  }
});

module.exports = router;
