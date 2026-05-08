const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const path = require('path'); // Added for serving static files (like uploaded images)
const multer = require('multer'); // Multer is a middleware for handling multipart/form-data, which is primarily used for uploading files. In this case, it will be used to handle image uploads for the links.
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const pool = require('./db');

dotenv.config();

const app = express();

// Middleware to check if user is logged in before allowing access to certain routes
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      message: 'Not logged in.'
    });
  }

  next();
}

const PORT = process.env.PORT || 8080;

const MySQLStore = MySQLStoreFactory(session); // Create a MySQL session store using the connection pool
const sessionStore = new MySQLStore({}, pool); // Use the connection pool for session storage

const allowedOrigins = [
  'http://localhost:5173',
  'https://linklibrarian-frontend-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files from the 'uploads' directory - the directory that will hold the images uploaded by users for their links. This allows the frontend to access these images via URLs that point to this directory.

// Configure storage destination and filename generation for uploaded files
const storage = multer.diskStorage({
  // Step 1: Define where uploaded files will be stored (in the 'uploads' directory)
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  // Step 2: Generate unique filenames to avoid collisions
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Step 3: Create a filter function to validate that only image files are accepted
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  // Check if the uploaded file's MIME type is in the allowedTypes list
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only JPG, PNG, and GIF image files are allowed.')); // Reject the file
  }
};

// Step 4: Configure multer middleware with storage location, file validation, and size limits
const upload = multer({
  storage, // Use the storage configuration defined above
  fileFilter: imageFileFilter, // Apply the image type validation filter
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
  }
});


app.use(session({
  key: 'linklibrarian.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

        // Begin of API routes - Learning Note: Every route first tests for a failure case because a failure response is considered the backup response that should happen if the first functionality of the route fails to operate; The fail case holds the relational link of '0' to '1' as a precursor waiting for any case that the first response fails. 
        // (The interesting AI suggestion completion):This is a common pattern in API development to ensure that error handling is in place before executing the main logic of the route. By checking for failure conditions early, we can return appropriate error responses and prevent unnecessary processing if the request is invalid or if there are issues with authentication, database queries, etc. This approach helps improve the robustness and reliability of the API.

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('LinkLibrarian backend is running.');
});

// Test route to check database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS database_name');
    res.json({
      message: 'Database connection successful.',
      database: rows[0]
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      message: 'Database query failed.',
      error: error.message
    });
  }
});

// Get route to fetch all links for the logged-in user
app.get('/api/links', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT id, user_id, title, url, notes, tags, image_path, created_at, updated_at
      FROM links
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.session.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch links:', error);
    res.status(500).json({
      message: 'Failed to fetch links.',
      error: error.message
    });
  }
});

// Post route to create a new link
app.post('/api/links', requireLogin, async (req, res) => {
  try {
    const { title, url, notes, tags } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        message: 'Title and url are required.'
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO links (user_id, title, url, notes, tags)
      VALUES (?, ?, ?, ?, ?)
      `,
      [req.session.user.id, title, url, notes || '', tags || '']
    );

    const [rows] = await pool.query(
      `
      SELECT id, user_id, title, url, notes, tags, image_path, created_at, updated_at
      FROM links
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Failed to create link:', error);
    res.status(500).json({
      message: 'Failed to create link.',
      error: error.message
    });
  }
});

// Post route to upload an image for a link
app.post('/api/links/:id/image', requireLogin, upload.single('image'), async (req, res) => {
  try {
    const linkId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({
        message: 'Please select an image file.'
      });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const [result] = await pool.query(
      `
      UPDATE links
      SET image_path = ?
      WHERE id = ? AND user_id = ?
      `,
      [imagePath, linkId, req.session.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Link not found.'
      });
    }

    res.status(200).json({
      message: 'Image uploaded successfully.',
      imagePath
    });
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(500).json({
      message: 'Image upload failed.',
      error: error.message
    });
  }
});

// Put route to update an existing link
app.put('/api/links/:id', requireLogin, async (req, res) => {
  try {
    const linkId = Number(req.params.id);
    const { title, url, notes, tags } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        message: 'Title and url are required.'
      });
    }

    const [result] = await pool.query(
      `
      UPDATE links
      SET title = ?, url = ?, notes = ?, tags = ?
      WHERE id = ? AND user_id = ?
      `,
      [title, url, notes || '', tags || '', linkId, req.session.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Link not found.'
      });
    }

    const [rows] = await pool.query(
      `
      SELECT id, user_id, title, url, notes, tags, image_path, created_at, updated_at
      FROM links
      WHERE id = ?
      `,
      [linkId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Failed to update link:', error);
    res.status(500).json({
      message: 'Failed to update link.',
      error: error.message
    });
  }
});

// Delete route to remove a link
app.delete('/api/links/:id', requireLogin, async (req, res) => {
  try {
    const linkId = Number(req.params.id);

    const [result] = await pool.query(
      `
      DELETE FROM links
      WHERE id = ? AND user_id = ?
      `,
      [linkId, req.session.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Link not found.'
      });
    }

    res.json({
      message: 'Link deleted successfully.'
    });
  } catch (error) {
    console.error('Failed to delete link:', error);
    res.status(500).json({
      message: 'Failed to delete link.',
      error: error.message
    });
  }
});

// Register route to create a new user account
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    // Example description of error case first-checking: This component checks if a user with the provided email already exists by querying the database of users. If a match is found to an email already registered, it returns a 409 Conflict response with a message indicating that an account with that email already exists. This prevents duplicate accounts from being created with the same email address.
    if (existingUsers.length > 0) { 
      return res.status(409).json({
        message: 'An account with that email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );

    req.session.user = {
      id: result.insertId,
      email
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save failed after register:', err);
        return res.status(500).json({
          message: 'Registration succeeded, but session creation failed.'
        });
      }

      res.status(201).json({
        message: 'Registration successful.',
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('Register failed:', error);
    res.status(500).json({
      message: 'Registration failed.',
      error: error.message
    });
  }
});

// Login route to authenticate a user and create a session
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    req.session.user = {
      id: user.id,
      email: user.email
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save failed after login:', err);
        return res.status(500).json({
          message: 'Login succeeded, but session creation failed.'
        });
      }

      res.json({
        message: 'Login successful.',
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({
      message: 'Login failed.',
      error: error.message
    });
  }
});

// Logout route to destroy the user's session
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).json({
        message: 'Logout failed.'
      });
    }

    res.clearCookie('linklibrarian.sid');
    res.json({
      message: 'Logout successful.'
    });
  });
});

// Get route to check if user is logged in and return user info
app.get('/api/session', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      loggedIn: false
    });
  }

  res.json({
    loggedIn: true,
    user: req.session.user
  });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});