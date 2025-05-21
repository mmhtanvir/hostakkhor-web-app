import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import sharp from 'sharp';

const __dirname = path.resolve();

const app = express();

// Enable CORS
app.use(cors({origin: "*"}));
const port = 8082;
const uploadDir = path.join(__dirname, 'uploads');
const viewsDir = path.join(__dirname, 'views');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4().slice(0, 8);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Limit the original name to 24 characters
    const truncatedName = nameWithoutExt.slice(0, 24);
    cb(null, `${uniqueId}-${truncatedName}${ext}`);
  },
});

const isImage = (mimeType) => {
  return mimeType.startsWith('image/') && mimeType !== 'image/svg+xml';
};

const compressImage = async (inputPath, outputPath) => {
  sharp.cache(false);
  await sharp(inputPath)
    .jpeg({ quality: 80 })
    .png({ quality: 80 })
    .webp({ quality: 80 })
    .toFile(outputPath);
  
};

const upload = multer({ storage });

// Serve the frontend HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(viewsDir, 'index.html'));
});

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log("req.file.mimetype", req.file.mimetype)
    if (isImage(req.file.mimetype)) {
      const originalPath = req.file.path;
      const fileExt = path.extname(req.file.originalname);
      const compressedFilename = `compressed-${req.file.filename}`;
      const compressedPath = path.join(uploadDir, compressedFilename);

      // Compress the image
      await compressImage(originalPath, compressedPath);
      
      // Delete the original file
      await fs.unlink(originalPath);

      return res.json({ 
        message: 'File uploaded and compressed successfully', 
        filename: compressedFilename 
      });
    }

    res.json({ 
      message: 'File uploaded successfully', 
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// View file list route with search and pagination
app.get('/files', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const files = await fs.readdir(uploadDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const stats = await fs.stat(path.join(uploadDir, filename));
        return {
          name: filename,
          size: stats.size,
          lastModified: stats.mtime
        };
      })
    );

    // Filter files based on search query
    const filteredFiles = fileDetails.filter(file =>
      file.name.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate pagination
    const totalFiles = filteredFiles.length;
    const totalPages = Math.ceil(totalFiles / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Sort files by last modified date (newest first)
    const sortedFiles = filteredFiles.sort((a, b) => 
      b.lastModified.getTime() - a.lastModified.getTime()
    );

    const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

    res.json({
      files: paginatedFiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalFiles,
        limit
      }
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Error reading directory' });
  }
});

// Download file route
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Delete file route
app.delete('/delete/:filename', async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  try {
    await fs.unlink(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve static files
app.use('/files', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});