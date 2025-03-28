require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 9000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
    store: MongoStore.create({
        mongoUrl: process.env.URI,  // Gebruik je MongoDB URI
        dbName: process.env.DB_NAME, // Specificeer de databasenaam
        collectionName: 'sessions' // Specificeer de collectienaam (optioneel, standaard 'sessions')
    }),
    cookie: {
        secure: false, // true in productie met HTTPS
        httpOnly: true, // Beschermt de cookie tegen toegang via client-side script
        maxAge: 1000 * 60 * 60 * 24 // Cookie verloopt na 1 dag
    }
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

// Authentication Middleware
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/log-in');
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

// Routes
app.get('/', async (req, res) => {
  try {
      const imageUrls = await fetchUnsplashImages('tattoo', 30, 'relevant');
      res.render("begin.ejs", { imageUrls: imageUrls, currentSort: 'relevant', pageTitle: 'Home' });
  } catch (error) {
      console.error("Error in home route:", error);
      res.status(500).send("Er is een fout opgetreden bij het laden van de startpagina");
  }
});

app.get('/index', isAuthenticated, async (req, res) => {
  try {
      const usersCollection = db.collection('users');
      const artistsCollection = db.collection('artists');

      if (!db) throw new Error("Database connection is not established");

      let user = null;
      let collectionName = 'users';

      try {
          const { ObjectId } = require('mongodb');
          user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
      } catch (error) {
          console.log("Error fetching user from users collection:", error);
      }

      if (!user) {
          try {
              const { ObjectId } = require('mongodb');
              user = await artistsCollection.findOne({ _id: new ObjectId(req.session.userId) });
              collectionName = 'artists';
          } catch (error) {
              console.log("Error fetching user from artists collection:", error);
          }
      }

      if (!user) throw new Error("User not found");

      const postsCollection = db.collection('posts');

      const sortBy = req.query.sort_by || 'relevant';
      const styles = req.session.userPreferences?.tattooStijl || [];
      const colors = req.query.colors || '';
      const tattooPlek = req.query.tattooPlek || '';
      const woonplaats = req.query.woonplaats || '';

      console.log("Query parameters:", { styles, colors, tattooPlek, woonplaats });

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

      console.log("Unsplash query:", query);

      const imageUrls = await fetchUnsplashImages(query, 28, sortBy);
      console.log("Fetched Unsplash images:", imageUrls);

      let filteredPosts = await postsCollection.find().toArray();
      if (user?.tattooStijl) {
          filteredPosts = filteredPosts.filter(post => user.tattooStijl.includes(post.style));
      }

      console.log("Filtered posts:", filteredPosts);

      res.render('index.ejs', {
          pageTitle: 'Home',
          username: req.session.username,
          gridImages: imageUrls,
          currentSort: sortBy,
          isArtist: req.session.isArtist,
          posts: filteredPosts,
          userPreferences: user || {},
          styles,
          colors,
          tattooPlek,
          woonplaats
      });

  } catch (error) {
      console.error("Error fetching images for index:", error);
      res.status(500).send("Er is een fout opgetreden bij het laden van de homepagina");
  }
});

app.post('/index', isAuthenticated, async (req, res) => {
  try {
      const { tattooStijl, tattooKleur, tattooPlek, woonplaats } = req.body;

      // Formatteer de antwoorden als queryparameters
      const queryParams = [
          `styles=${tattooStijl ? tattooStijl.join(',') : ''}`,
          `colors=${tattooKleur || ''}`,
          `tattooPlek=${tattooPlek || ''}`,
          `woonplaats=${woonplaats || ''}`
      ].join('&');

      console.log("Redirecting with query params:", queryParams);  // Toevoegen van logging
      res.redirect(`/index?${queryParams}`);
  } catch (error) {
      console.error("Error processing form data:", error);  // Gedetailleerdere logging
      res.status(500).send("Er is een fout opgetreden bij het verwerken van de gegevens");
  }
});

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

        req.session.userId = result.insertedId.toString();
        req.session.username = sanitizedUsername;
        req.session.email = email;

        return res.redirect('/index');
    } catch (error) {
        console.error("Registratiefout:", error);
        res.status(500).render("error.ejs", {
            message: "Registratiefout",
            error: error.message
        });
    }
});

// Route voor het weergeven van het registratieformulier voor artiesten
app.get('/registerArtists', (req, res) => {
  res.render("registerArtists.ejs", {
      pageTitle: 'Registreer artiest',
      mapboxToken: process.env.MAPBOX_TOKEN // Zorg ervoor dat je deze in je .env bestand hebt
  });
});

// Route voor het verwerken van het registratieformulier voor artiesten
app.post('/registerArtists', async (req, res) => {
  try {
      const collection = db.collection('artists');
      const { username, email, password, confirmPassword, studioName, studioAddress, studioLat, studioLng } = req.body;

      // Validatie van alle velden
      if (!username || !email || !password || !confirmPassword || !studioName || !studioAddress || !studioLat || !studioLng) {
          return res.status(400).send("Alle velden zijn verplicht");
      }

      // Type checking
      if (typeof username !== 'string' ||
          typeof email !== 'string' ||
          typeof password !== 'string' ||
          typeof confirmPassword !== 'string' ||
          typeof studioName !== 'string' ||
          typeof studioAddress !== 'string' ||
          typeof studioLat !== 'string' ||
          typeof studioLng !== 'string') {
          return res.status(400).send("Ongeldig formulierformaat");
      }

      // E-mail validatie
      if (!validator.isEmail(email)) {
          return res.status(400).send("Ongeldig e-mailadres");
      }

      // Wachtwoord validatie
      if (!validator.isLength(password, { min: 8 })) {
          return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
      }

      if (password !== confirmPassword) {
          return res.status(400).send("Wachtwoorden komen niet overeen");
      }

      // Controleer of e-mail al in gebruik is
      const existingUser = await collection.findOne({ email: email });
      if (existingUser) {
          return res.status(400).send("Dit e-mailadres is al in gebruik");
      }

      // Hash het wachtwoord
      const hashedPassword = await hashPassword(password);

      // Sanitize input
      const sanitizedUsername = xss(username);
      const sanitizedStudioName = xss(studioName);
      const sanitizedStudioAddress = xss(studioAddress);

      // Maak nieuw artiest object
      const newArtist = {
          username: sanitizedUsername.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          studioName: sanitizedStudioName.trim(),
          studioAddress: sanitizedStudioAddress.trim(),
          studioLocation: {
              type: "Point",
              coordinates: [parseFloat(studioLng), parseFloat(studioLat)]
          },
          createdAt: new Date()
      };

      // Voeg de nieuwe artiest toe aan de database
      const result = await collection.insertOne(newArtist);

      // Optioneel: Automatisch inloggen na registratie
      req.session.userId = result.insertedId.toString();
      req.session.username = sanitizedUsername;
      req.session.email = email;
      req.session.isArtist = true;

      // Redirect naar de artiestenpagina of dashboard
      return res.redirect('/index');

  } catch (error) {
      console.error("Registratiefout:", error);
      res.status(500).render("error.ejs", {
          message: "Er is een fout opgetreden bij de registratie",
          error: error.message
      });
  }
});

// Login Route
app.get('/log-in', (req, res) => res.render("log-in.ejs", { pageTitle: 'Inloggen' }));

app.post('/log-in', async (req, res) => {
  try {
      const { email, password } = req.body;

      // Haal de collecties op
      const usersCollection = db.collection('users');
      const artistsCollection = db.collection('artists');

      // Zoek gebruiker in 'users' collectie
      let user = await usersCollection.findOne({ email });
      let isArtist = false;

      // Controleer eerst het wachtwoord voor 'users'
      if (user && await bcrypt.compare(password, user.password)) {
          req.session.userId = user._id.toString();
          req.session.username = user.username;
          req.session.email = user.email;
          req.session.isArtist = false;
          return res.redirect('/index');
      }

      // Zo niet, zoek in 'artists' collectie
      user = await artistsCollection.findOne({ email });
      if (user && await bcrypt.compare(password, user.password)) {
          req.session.userId = user._id.toString();
          req.session.username = user.username;
          req.session.email = user.email;
          req.session.isArtist = true;
          return res.redirect('/index');
      }

      return res.status(400).send("Incorrect e-mail of wachtwoord");

  } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Er is een fout opgetreden bij het inloggen");
  }
});

app.post('/submit-post', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
      const collection = db.collection('posts');

      // Controleer of een bestand is geüpload
      const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

      // Valideer de aanwezigheid van verplichte velden
      if (!req.body.description || !req.body.studioName || !req.body.studioAddress) {
          return res.status(400).json({ success: false, message: 'Beschrijving, studionaam en adres zijn verplicht.' });
      }

      // Parse de tags, zorg ervoor dat het een array is
      let tags = [];
      try {
          tags = req.body.tags ? req.body.tags.split(',') : [];
          // Verwijder lege strings en trim de tags
          tags = tags.map(tag => tag.trim()).filter(tag => tag !== '');
      } catch (error) {
          console.error('Fout bij het verwerken van tags:', error);
          return res.status(400).json({ success: false, message: 'Ongeldige tags format.' });
      }

      // Data opslaan in MongoDB
      const newPost = {
          description: xss(req.body.description),
          tags: tags.map(tag => xss(tag)),
          studio: {
              name: xss(req.body.studioName),
              address: xss(req.body.studioAddress),
              lat: parseFloat(req.body.studioLat),
              lng: parseFloat(req.body.studioLng)
          },
          photo: photoPath,
          createdAt: new Date(),
          userId: req.session.userId
      };

      const result = await collection.insertOne(newPost);

      if (result.acknowledged) {
          return res.status(200).json({ success: true, message: 'Post succesvol toegevoegd' });
      } else {
          console.error('Fout bij het toevoegen van de post aan de database');
          return res.status(500).json({ success: false, message: 'Fout bij het toevoegen van de post aan de database' });
      }

  } catch (error) {
      console.error('Fout bij het opslaan van de post:', error);
      return res.status(500).json({ success: false, message: 'Er is een fout opgetreden bij het opslaan van de post: ' + error.message });
  }
});

app.get('/artiesten', isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection('artists');
    const artists = await collection.find().toArray();
    res.render('artiesten.ejs', {
      pageTitle: 'Artiesten',
      artists: artists,
      currentSort: 'relevant'
    });
  } catch (error) {
    console.error("Fout bij het ophalen van artiesten:", error);
    res.status(500).send("Er is een fout opgetreden bij het laden van de artiestenpagina");
  }
});

app.get('/artiest/:id', isAuthenticated, async (req, res) => {
  try {
    const collection = db.collection('artists');
    const artist = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!artist) {
      return res.status(404).send("Artiest niet gevonden");
    }

    res.render('detailpaginaA.ejs', {
      pageTitle: `Artiest: ${artist.username}`,
      artist: artist
    });
  } catch (error) {
    console.error("Fout bij het ophalen van artiest details:", error);
    res.status(500).send("Er is een fout opgetreden bij het laden van de artiestenpagina");
  }
});

app.get('/questionnaire', isAuthenticated, (req, res) => {
  const styles = req.session.userPreferences ? req.session.userPreferences.tattooStijl : [];
  const colors = req.session.userPreferences ? req.session.userPreferences.tattooKleur : '';
  const tattooPlek = req.session.userPreferences ? req.session.userPreferences.tattooPlek : [];
  const woonplaats = req.session.userPreferences ? req.session.userPreferences.woonplaats : [];

  res.render('questionnaire.ejs', {
    pageTitle: 'Vragenlijst',
    styles: styles,
    colors: colors,
    tattooPlek: tattooPlek,
    woonplaats: woonplaats
  });
});

app.post('/questionnaire', isAuthenticated, (req, res) => {
  const { tattooStijl, tattooKleur, tattooPlek, woonplaats } = req.body;

  // Sla de antwoorden op in de sessie
  req.session.userPreferences = {
    tattooStijl: Array.isArray(tattooStijl) ? tattooStijl : [tattooStijl],
    tattooKleur: tattooKleur || '',
    tattooPlek: tattooPlek || '',
    woonplaats: woonplaats || ''
  };

  // Redirect naar de index pagina met query parameters
  const queryParams = new URLSearchParams({
    styles: req.session.userPreferences.tattooStijl.join(','),
    colors: req.session.userPreferences.tattooKleur,
    tattooPlek: req.session.userPreferences.tattooPlek,
    woonplaats: req.session.userPreferences.woonplaats
  });

  res.redirect(`/index?${queryParams.toString()}`);
});

app.post('/save-answers', async (req, res) => {
  // Controleer of de gebruiker ingelogd is via de sessie
  if (!req.session.userId) {
      console.log("Geen ingelogde gebruiker gevonden in de sessie.");
      return res.status(401).send('Je moet ingelogd zijn om je voorkeuren op te slaan.');
  }

  // Verkrijg de gegevens van het formulier
  const { tattooStijl, tattooKleur, tattooPlek, woonplaats } = req.body;

  console.log("Antwoorden ontvangen:", req.body); // Dit zal helpen bij debugging om te controleren of de antwoorden goed binnenkomen

  try {
      // Verkrijg de users collectie
      const usersCollection = db.collection('users'); // Aangezien de gebruikers in de 'users' collectie staan

      // Update de voorkeuren van de gebruiker in de database
      const updateResult = await usersCollection.updateOne(
          { _id: new ObjectId(req.session.userId) }, // Voeg 'new' toe om een ObjectId te maken
          {
              $set: {
                  preferences: {
                      tattooStijl: Array.isArray(tattooStijl) ? tattooStijl : [tattooStijl], // Controleer of tattooStijl een array is (voor checkboxes)
                      tattooKleur,
                      tattooPlek,
                      woonplaats
                  }
              }
          }
      );

      // Controleer of de update is gelukt
      if (updateResult.modifiedCount > 0) {
          console.log("Gebruiker geüpdatet met voorkeuren:", updateResult);
          res.redirect('/index'); // Redirect naar de gewenste pagina (bijvoorbeeld de homepage)
      } else {
          res.status(404).send('Geen gebruiker gevonden om bij te werken.');
      }
  } catch (err) {
      console.error("Fout bij opslaan:", err);
      res.status(500).send('Er is een fout opgetreden bij het opslaan van je voorkeuren.');
  }
});


// Route voor het tonen van tattoos in de 'classic' categorie
app.get('/tattoos/:category', async (req, res) => {
  try {
      const category = req.params.category;
      const postsCollection = db.collection('posts');

      // Zoek naar posts die overeenkomen met de categorie
      const categoryPosts = await postsCollection.find({ category: category }).toArray();

      // Render de pagina voor deze categorie met de gevonden posts
      res.render('category.ejs', {
          pageTitle: `${category.charAt(0).toUpperCase() + category.slice(1)} Tattoos`,
          posts: categoryPosts
      });
  } catch (error) {
      console.error("Error fetching category tattoos:", error);
      res.status(500).send("Er is een fout opgetreden bij het ophalen van de tattoo categorie.");
  }
});

// Zorg ervoor dat je de juiste databaseverbinding en collections hebt
app.get('/carouselDetail', async (req, res) => {
  try {
      // Haal de categorie op uit de querystring (bijvoorbeeld 'natuur')
      const category = req.query.category || '';
      const postsCollection = db.collection('posts');

      // Haal de posts voor deze categorie op uit de database
      const posts = await postsCollection.find({ style: category }).toArray();

      // Render de carouselDetail.ejs pagina met de posts
      res.render('carouselDetail.ejs', {
          pageTitle: `${category} Tattoos`,
          category: category,
          posts: posts
      });

  } catch (error) {
      console.error("Error fetching details for carousel:", error);
      res.status(500).send("Er is een fout opgetreden bij het laden van de detailpagina");
  }
});

app.get('/detail/:id', isAuthenticated, (req, res) => {
    res.render('detailpagina', { id: req.params.id, pageTitle: 'Detailpagina' });
});

app.get('/preview', isAuthenticated, (req, res) => {
    res.render('preview', { pageTitle: 'Preview' });
});

app.get('/search', isAuthenticated, async (req, res) => {
    try {
        const query = req.query.q || '';
        const sortBy = req.query.sort_by || 'relevant';

        if (!query) {
            return res.status(400).send("Zoekterm is vereist");
        }

        const imageUrls = await fetchUnsplashImages(query, 28, sortBy);
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

app.get('/search-artists', isAuthenticated, async (req, res) => {
    try {
        const query = req.query.q || '';

        if (!query) {
            return res.json({ artists: [] });
        }

        const collection = db.collection('artists');
        const artists = await collection.find({
            username: { $regex: query, $options: 'i' }
        }).toArray();

        res.json({ artists: artists });
    } catch (error) {
        console.error("Fout bij het zoeken naar artiesten:", error);
        res.status(500).json({ error: "Er is een fout opgetreden bij het zoeken naar artiesten" });
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
