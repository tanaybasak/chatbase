const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ChatKit session endpoint
app.post('/api/chatkit/session', async (req, res) => {
  try {
    const workflowId = process.env.REACT_APP_CHATKIT_WORKFLOW_ID;
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const enableAttachments = process.env.REACT_APP_ENABLE_ATTACHMENTS === 'true';

    if (!workflowId || !apiKey) {
      return res.status(500).json({ 
        error: 'Missing configuration. Please set REACT_APP_CHATKIT_WORKFLOW_ID and REACT_APP_OPENAI_API_KEY' 
      });
    }

    // Create ChatKit session
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workflow: { id: workflowId },
        user: req.body.deviceId || `user-${Date.now()}`,
        chatkit_configuration: {
          file_upload: {
            enabled: enableAttachments
          }
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({ error: 'Failed to create ChatKit session' });
    }

    const data = await response.json();
    res.json({ client_secret: data.client_secret });
  } catch (error) {
    console.error('Error creating ChatKit session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload endpoint for ChatKit attachments
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      preview_url: req.file.mimetype.startsWith('image/') 
        ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` 
        : null
    };

    console.log('File uploaded:', attachment);
    res.json(attachment);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`ChatKit backend running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});

// Keep the process alive and handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
