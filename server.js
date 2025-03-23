require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const session = require('express-session');
const port = 9000;
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const { register } = require('swiper/element');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs').set('views', 'views');
app.use("/static", express.static("static"));
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Database Connection
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);

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

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
      return next(); // Ga door naar de volgende middleware of route handler
  }
  res.redirect('/log-in'); // Stuur de gebruiker naar de login pagina als deze niet is ingelogd
}



// Helper Functions
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function fetchUnsplashImages(query, count = 30, sortBy = 'relevant') {
  try {
      const unsplashApiKey = process.env.UNSPLASH_API_KEY;
      let apiUrl = `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}&orientation=landscape`;

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
          const errorText = await response.text();
          throw new Error(`Unsplash API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const imageUrls = data.results.map(image => ({
          url: image.urls.regular,
          width: image.width,
          height: image.height,
          alt_description: image.alt_description || ''
      }));

      return imageUrls;
  } catch (error) {
      console.error('Error fetching Unsplash images:', error);
      return [];
  }
}



// Registration Route
app.get('/register', (req, res) => res.render("register.ejs", { pageTitle: 'Registreren' }));

app.post('/register', async (req, res) => {
    try {
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

        const hashedPassword = await hashPassword(password);
        const sanitizedUsername = xss(username);
        const newUser = {
            username: sanitizedUsername.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        };

        const result = await collection.insertOne(newUser);

        // Set session *after* successful registration
        req.session.userId = result.insertedId;
        req.session.username = sanitizedUsername;
        req.session.email = email;

        // Redirect to /index route after successful registration
        return res.redirect('/index');

    } catch (error) {
        console.error("Registratiefout:", error);
        res.status(500).render("error.ejs", {
            message: "Registratiefout",
            error: error.message
        });
    }
});

// Login Route
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
            req.session.userId = user._id;
            req.session.username = user.username;
            req.session.email = user.email;

            res.redirect('/index');
        } else {
            res.status(400).send("Incorrect wachtwoord");
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Er is een fout opgetreden bij het inloggen");
    }
});

// Other Routes
app.get('/profiel', isAuthenticated, (req, res) => {
    res.render('profiel.ejs', { pageTitle: 'Profiel' });
});

app.get('/post', isAuthenticated, (req, res) => {
    res.render('post.ejs', { pageTitle: 'Post' });
});

app.get('/artiesten', isAuthenticated, (req, res) => {
    res.render('artiesten.ejs', { pageTitle: 'Artiesten' });
});

app.get('/zie-alle', isAuthenticated, (req, res) => {
    res.render('zie-alle.ejs', { pageTitle: 'Overzicht' });
});

app.get('/detail/:id', isAuthenticated, (req, res) => {
    res.render('detailpagina', { id: req.params.id, pageTitle: 'Detailpagina' });
});

app.get('/preview', isAuthenticated, (req, res) => {
    res.render('preview', { pageTitle: 'Preview' });
});

app.get('/index', isAuthenticated, async (req, res) => {
    try {
        const sortBy = req.query.sort_by || 'relevant';
        const styles = req.query.styles ? req.query.styles.split(',') : [];
        const colors = req.query.colors || '';

        let query = 'tattoo';

        if (styles.length > 0) {
            const styleQueries = styles.map(style => {
                switch (style) {
                    case 'classic': return 'classic tattoo';
                    case 'realistic': return 'realistic tattoo';
                    case 'modern': return 'modern tattoo';
                    case 'minimalistic': return 'minimalistic tattoo';
                    case 'cultural': return 'cultural tattoo';
                    case 'cartoon': return 'cartoon tattoo';
                    case 'old': return 'old tattoo';
                    default: return 'tattoo';
                }
            });
            query = styleQueries.join(' ');
        }

        if (colors === 'black_and_white') {
            query += ' black and white tattoo';
        } else if (colors === 'color') {
            query += ' colorful tattoo';
        }

        const imageUrls = await fetchUnsplashImages(query, 28, sortBy);
        res.render('index.ejs', {
            pageTitle: 'Home',
            username: req.session.username,
            gridImages: imageUrls,
            currentSort: sortBy
        });
    } catch (error) {
        console.error("Error fetching images for index:", error);
        res.status(500).send("Er is een fout opgetreden bij het laden van de homepagina");
    }
});

app.get('/search', isAuthenticated, async (req, res) => {
  try {
      const query = req.query.q || ''; // Haal de zoekterm op, of gebruik een lege string als default
      const sortBy = req.query.sort_by || 'relevant'; // Optioneel: voeg sorteeropties toe

      if (!query) {
          return res.status(400).send("Zoekterm is vereist");
      }

      const imageUrls = await fetchUnsplashImages(query, 28, sortBy); // Gebruik de fetchUnsplashImages functie
      res.render('index.ejs', {
          pageTitle: `Zoekresultaten voor "${query}"`,
          username: req.session.username,
          gridImages: imageUrls,
          currentSort: sortBy
      });
  } catch (error) {
      console.error("Error fetching search results:", error);
      res.status(500).send("Er is een fout opgetreden bij het ophalen van zoekresultaten");
  }
});

// Error Handling
app.use((req, res) => {
    res.status(404).send('404 - Pagina niet gevonden');
    console.log(`404 Error: ${req.originalUrl}`);
});

app.use((err, req, res, next) => {
    console.error("Unexpected error:", err);
    res.status(500).render("error.ejs", {
        message: "Serverfout",
        error: err.message
    });
});

// Start Server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});

