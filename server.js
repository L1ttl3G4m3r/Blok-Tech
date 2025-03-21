
require('dotenv').config();

const express = require('express');
const app = express();
const port = 9000;
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);
const unsplashApiKey = process.env.UNSPLASH_API_KEY;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs').set('views', 'views');
app.use("/static", express.static("static"));

// Hulpfuncties
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function fetchUnsplashImages(query, count = 30) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&count=${count}&orientation=landscape`, 
      {
        headers: { 
          'Authorization': `Client-ID ${unsplashApiKey}`,
          'Accept-Version': 'v1'
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Unsplash API Error: ${error.errors.join(', ')}`);
    }
    
    const data = await response.json();
    console.log('Received data from Unsplash:', data.slice(0, 2)); // Log first two items
    
    const imageUrls = data.map(image => ({
      url: image.urls.regular,
      width: image.width,
      height: image.height
    }));
    console.log('Processed image URLs:', imageUrls.slice(0, 2)); // Log first two items
    
    return imageUrls;
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return [];
  }
}

// Connectie
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to database");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
}

connectToDatabase();

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// Routes
app.get('/', async (req, res) => {
  try {
    const imageUrls = await fetchUnsplashImages('tattoo', 30);
    console.log('Image URLs being sent to template:', imageUrls.slice(0, 2)); // Log first two items
    res.render("begin.ejs", { imageUrls: imageUrls });
  } catch (error) {
    console.error("Error in home route:", error);
    res.status(500).send("Er is een fout opgetreden bij het laden van de startpagina");
  }
});

app.get('/register', (req, res) => res.render("register.ejs", { pageTitle: 'Registreren' }));

app.post('/register', async (req, res) => {
  try {
      console.log("Ontvangen registratiegegevens:", req.body);
      const collection = db.collection('users');
      const { username, email, password, confirmPassword } = req.body;

      if (!username || !email || !password || !confirmPassword) {
          return res.status(400).send("Alle velden zijn verplicht");
      }

      if (typeof username !== 'string' || 
          typeof email !== 'string' || 
          typeof password !== 'string' || 
          typeof confirmPassword !== 'string') {
          return res.status(400).send("Ongeldig formulierformaat");
      }

      if (!validator.isEmail(email)) {
          return res.status(400).send("Ongeldig e-mailadres");
      }

      if (!validator.isLength(password, { min: 8 })) {
          return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
      }

      if (password !== confirmPassword) {
          return res.status(400).send("Wachtwoorden komen niet overeen");
      }

      const existingUser = await collection.findOne({ email: email });
      if (existingUser) {
          return res.status(400).send("Dit e-mailadres is al in gebruik");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const sanitizedUsername = xss(username);
      const newUser = { 
          username: sanitizedUsername.trim(), 
          email: email.trim().toLowerCase(), 
          password: hashedPassword 
      };

      const result = await collection.insertOne(newUser);
      console.log("Nieuwe gebruiker aangemaakt met ID:", result.insertedId);

      res.render("index.ejs", { 
          username: sanitizedUsername,
          email: email
      });

  } catch (error) {
      console.error("Registratiefout:", error);
      res.status(500).render("error.ejs", {
          message: "Registratiefout",
          error: error.message
      });
  }
});

app.get('/log-in', (req, res) => res.render("log-in.ejs", { pageTitle: 'Inloggen' }));

app.post('/log-in', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { email, password } = req.body;
        const user = await collection.findOne({ email: email });
        if (!user) {
            return res.status(400).send("Gebruiker niet gevonden");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.render("index.ejs", { username: user.username });
        } else {
            res.status(400).send("Incorrect wachtwoord");
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Er is een fout opgetreden bij het inloggen");
    }
});

app.get('/profiel', (req, res) => {
    res.render('profiel.ejs', { pageTitle: 'Profiel' });
  });
  
  app.get('/post', (req, res) => {
    res.render('post.ejs', { pageTitle: 'Post' });
  });
  
  app.get('/artiesten', (req, res) => {
    res.render('artiesten.ejs', { pageTitle: 'Artiesten' });
  });
  
  app.get('/zie-alle', (req, res) => {
    res.render('zie-alle.ejs', { pageTitle: 'Overzicht' });
  });
  
  app.get('/detail/:id', (req, res) => {
    res.render('detailpagina', { id: req.params.id }, { pageTitle: 'Detailpagina' });
  });

  app.get('/preview', (req, res) => {
    res.render('preview', { pageTitle: 'Preview' });
  });

  app.get('/index', (req, res) => {
    res.render('index.ejs', { pageTitle: 'Home' } );
  });

// 404 handler
app.use((req, res) => {
    res.status(404).send('404 - Pagina niet gevonden');
    console.log(`404 Error: ${req.originalUrl}`);
});

// Algemene error handler
app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(500).render("error.ejs", {
      message: "Serverfout",
      error: err.message
  });
});
=======
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();
const port = 9000;
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);
const unsplashApiKey = process.env.UNSPLASH_API_KEY;
const mapboxToken = process.env.MAPBOX_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs').set('views', 'views');
app.use("/static", express.static("static"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(cors());

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function fetchUnsplashImages(query, count = 30, sortBy = 'relevant') {
    try {
        let apiUrl = `https://api.unsplash.com/photos/random?query=${query}&count=${count}&orientation=landscape`;
        if (sortBy !== 'relevant') {
            apiUrl += `&order_by=${sortBy}`;
        }

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Client-ID ${unsplashApiKey}`,
                'Accept-Version': 'v1'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Unsplash API Error: ${error.errors.join(', ')}`);
        }

        const data = await response.json();
        console.log('Received data from Unsplash:', data.slice(0, 2));

        const imageUrls = data.map(image => ({
            url: image.urls.regular,
            width: image.width,
            height: image.height
        }));
        console.log('Processed image URLs:', imageUrls.slice(0, 2));

        return imageUrls;
    } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        return [];
    }
}

// Connectie
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to database");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
}

connectToDatabase();

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/log-in');
}

app.get('/', async (req, res) => {
    try {
        const sortBy = req.query.sort_by || 'relevant';
        const styles = req.query.styles ? req.query.styles.split(',') : [];
        const colors = req.query.colors || '';

        let query = 'tattoo';

        if (styles.length > 0) {
            const styleQueries = styles.map(style => {
                switch (style) {
                    case 'classic':
                        return 'classic tattoo';
                    case 'realistic':
                        return 'realistic tattoo';
                    case 'modern':
                        return 'modern tattoo';
                    case 'minimalistic':
                        return 'minimalistic tattoo';
                    case 'cultural':
                        return 'cultural tattoo';
                    case 'cartoon':
                        return 'cartoon tattoo';
                    case 'old':
                        return 'old tattoo';
                    default:
                        return 'tattoo';
                }
            });
            query = styleQueries.join(' ');
        }

        if (colors === 'black_and_white') {
            query += ' black and white tattoo';
        } else if (colors === 'color') {
            query += ' colorful tattoo';
        }

        const imageUrls = await fetchUnsplashImages(query, 30, sortBy);
        console.log('Image URLs being sent to template:', imageUrls.slice(0, 2));
        res.render("begin.ejs", { imageUrls: imageUrls, currentSort: sortBy });
    } catch (error) {
        console.error("Error in home route:", error);
        res.status(500).send("Er is een fout opgetreden bij het laden van de startpagina");
    }
});

app.get('/register', (req, res) => res.render("register.ejs", { pageTitle: 'Registreren' }));

app.post('/register', async (req, res) => {
    try {
        console.log("Ontvangen registratiegegevens:", req.body);
        const collection = db.collection('users');
        const { username, email, password, confirmPassword } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).send("Alle velden zijn verplicht");
        }

        if (typeof username !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            typeof confirmPassword !== 'string') {
            return res.status(400).send("Ongeldig formulierformaat");
        }

        if (!validator.isEmail(email)) {
            return res.status(400).send("Ongeldig e-mailadres");
        }

        if (!validator.isLength(password, { min: 8 })) {
            return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
        }

        if (password !== confirmPassword) {
            return res.status(400).send("Wachtwoorden komen niet overeen");
        }

        const existingUser = await collection.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send("Dit e-mailadres is al in gebruik");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sanitizedUsername = xss(username);
        const newUser = {
            username: sanitizedUsername.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        };

        const result = await collection.insertOne(newUser);
        console.log("Nieuwe gebruiker aangemaakt met ID:", result.insertedId);

        // Set session *after* successful registration
        req.session.userId = result.insertedId;
        req.session.username = sanitizedUsername;
        req.session.email = email;

        // Fetch images *before* rendering
        let gridImages = [];
        try {
            const imageUrls = await fetchUnsplashImages('tattoo', 28);
            gridImages = imageUrls;
        } catch (error) {
            console.error('Error fetching images after registration:', error);
            // Set an empty array for gridImages to avoid rendering errors
            gridImages = [];
        }

        // Render index.ejs after successful registration
        res.render("index.ejs", {
            pageTitle: 'Home',
            username: sanitizedUsername,
            gridImages: gridImages
        });

    } catch (error) {
        console.error("Registratiefout:", error);
        res.status(500).render("error.ejs", {
            message: "Registratiefout",
            error: error.message
        });
    }
});

app.get('/registerArtists', (req, res) => {
    res.render('registerArtists.ejs', { mapboxToken: mapboxToken });
});

app.post('/registerArtists', async (req, res) => {
    try {
        const collection = db.collection('artists');
        const { username, email, password, confirmPassword, studioName, studioAddress, studioLat, studioLng } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).send("Alle velden zijn verplicht");
        }

        if (typeof username !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            typeof confirmPassword !== 'string') {
            return res.status(400).send("Ongeldig formulierformaat");
        }

        if (!validator.isEmail(email)) {
            return res.status(400).send("Ongeldig e-mailadres");
        }

        if (!validator.isLength(password, { min: 8 })) {
            return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
        }

        if (password !== confirmPassword) {
            return res.status(400).send("Wachtwoorden komen niet overeen");
        }

        const existingUser = await collection.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send("Dit e-mailadres is al in gebruik");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const sanitizedUsername = xss(username);

        const newArtist = {
            username: sanitizedUsername.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            studio: {
                name: studioName,
                address: studioAddress,
                coordinates: {
                    lat: parseFloat(studioLat),
                    lon: parseFloat(studioLng)
                }
            }
        };

        const result = await collection.insertOne(newArtist);

        req.session.userId = result.insertedId;
        req.session.username = sanitizedUsername;
        req.session.isArtist = true;

        res.render("artistProfile.ejs", {
            username: sanitizedUsername,
            email: email,
            studioName: studioName
        });

    } catch (error) {
        console.error("Registratiefout voor artiest:", error);
        res.status(500).render("error.ejs", {
            message: "Registratiefout voor artiest",
            error: error.message
        });
    }
});

app.get('/log-in', (req, res) => res.render("log-in.ejs", { pageTitle: 'Inloggen' }));

app.post('/log-in', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { email, password } = req.body;

        const user = await collection.findOne({ email: email });
        if (!user) {
            return res.status(400).send("Gebruiker niet gevonden");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Set session *after* successful login
            req.session.userId = user._id;
            req.session.username = user.username;

            // Fetch images *before* rendering
            let gridImages = [];
            try {
                const imageUrls = await fetchUnsplashImages('tattoo', 28);
                gridImages = imageUrls;
            } catch (error) {
                console.error('Error fetching images after login:', error);
                // Set an empty array for gridImages to avoid rendering errors
                gridImages = [];
            }

            // Render index.ejs after successful login
            res.render("index.ejs", {
                username: user.username,
                pageTitle: 'Home',
                gridImages: gridImages
            });

        } else {
            res.status(400).send("Incorrect wachtwoord");
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Er is een fout opgetreden bij het inloggen");
    }
});


app.get('/artistProfile', (req, res) => {
    res.render('artistProfile.ejs', { pageTitle: 'Artiest Profiel'})
});

app.get('/profiel', isAuthenticated, (req, res) => {
    res.render('profiel.ejs', { pageTitle: 'Profiel' });
});

app.get('/post', (req, res) => {
    res.render('post.ejs', { pageTitle: 'Post' });
});

app.get('/artiesten', (req, res) => {
    res.render('artiesten.ejs', { pageTitle: 'Artiesten' });
});

app.get('/zie-alle', (req, res) => {
    res.render('zie-alle.ejs', { pageTitle: 'Overzicht' });
});

app.get('/detail/:id', (req, res) => {
    res.render('detailpagina', { id: req.params.id }, { pageTitle: 'Detailpagina' });
});

app.get('/preview', (req, res) => {
    res.render('preview', { pageTitle: 'Preview' });
});

app.get('/index', async (req, res) => {
        let carouselImages = [];
        let gridImages = [];

        try {
            // Haal algemene tattoo afbeeldingen op voor de grid
            const gridResponse = await fetchUnsplashImages('tattoo', 28);  //Use the function you defined.

            gridImages = gridResponse;

            console.log("Grid Images:", gridImages);  // Check if images are being fetched

            res.render('index.ejs', {  // Corrected render statement
                carouselImages: carouselImages,
                gridImages: gridImages
            });
        } catch (error) {
            console.error('Error fetching images:', error);
            res.status(500).send('Er is een fout opgetreden bij het ophalen van afbeeldingen');
        }
    });

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.get('/api/studios', async (req, res) => {
    try {
        const collection = db.collection('tattoo_shops');
        const studios = await collection.find({}).toArray();
        res.json(studios);
    } catch (error) {
        console.error('Error fetching studios:', error);
        res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).send('404 - Pagina niet gevonden');
    console.log(`404 Error: ${req.originalUrl}`);
});

// Algemene error handler
app.use((err, req, res, next) => {
    console.error("Unexpected error:", err);
    res.status(500).render("error.ejs", {
        message: "Serverfout",
        error: err.message
    });
});