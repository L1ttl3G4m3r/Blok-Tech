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

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
      return next();
  }
  res.redirect('/log-in');
}

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
      
      req.session.userId = result.insertedId;
      req.session.username = sanitizedUsername;
      res.render("index.ejs",  { pageTitle: 'Profiel' },{ 
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
          req.session.userId = user._id;
          req.session.username = user.username;         
 res.render("index.ejs", { username: user.username },  { pageTitle: 'Profiel' });
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


  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.get('/profiel', isAuthenticated, (req, res) => {
    res.render('profiel.ejs', { username: req.session.username });
});

app.get('/post', isAuthenticated, (req, res) => {
    res.render('post.ejs');
});

app.get('/artiesten', (req, res) => {
    res.render('artiesten.ejs');
});

app.get('/zie-alle', (req, res) => {
    res.render('zie-alle.ejs');
});

app.get('/detail/:id', (req, res) => {
    res.render('detailpagina', { id: req.params.id });
});

app.get('/preview', (req, res) => {
    res.render('preview');
});

// Bestaande route voor index.ejs (na login/registratie)
app.get('/index', async (req, res) => {
  let carouselImages = [];
  let gridImages = [];

  try {
    // Haal algemene tattoo afbeeldingen op voor de grid
    const gridResponse = await unsplash.search.getPhotos({
      query: 'tattoo',
      perPage: 28
    });
    gridImages = gridResponse.response.results;

    // TODO: Implementeer vragenlijst en gebruikerstags
    // if (req.session.userTags) {
    //   const carouselResponse = await unsplash.search.getPhotos({
    //     query: `tattoo ${req.session.userTags.join(' ')}`,
    //     perPage: 10
    //   });
    //   carouselImages = carouselResponse.response.results;
    // }

    res.render('index', {
      carouselImages: carouselImages,
      gridImages: gridImages,
      // userTags: req.session.userTags
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Er is een fout opgetreden bij het ophalen van afbeeldingen');
  }
});

// TODO: Implementeer route voor vragenlijst
// app.get('/vragenlijst', (req, res) => {
//   res.render('vragenlijst');
// });

// app.post('/vragenlijst', (req, res) => {
//   req.session.userTags = req.body.tags;
//   res.redirect('/index');
// });

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