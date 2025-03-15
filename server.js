require('dotenv').config();
const express = require('express');
const app = express();
const port = 9000;
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Configuratie
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);
const unsplashApiKey = process.env.UNSPLASH_API_KEY;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs').set('views', 'views');
app.use("/static", express.static("static"));

// Hulpfuncties
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function fetchUnsplashImages(query, count = 70) {
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&count=${count}`, {
            headers: { 'Authorization': `Client-ID ${unsplashApiKey}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.map(image => ({
            url: image.urls.regular,
            height: image.height,
            width: image.width
        }));
    } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        return [];
    }
}

function isLoggedIn(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/log-in');
    }
  }
  

//Sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.URI,
      dbName: process.env.DB_NAME
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

app.get('/profiel', isLoggedIn, (req, res) => {
    res.render('profiel.ejs', { user: req.session.user });
  });


app.get('/log-out', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect('/');
    });
  });
  
  
  

// Database connectie
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

// Routes
app.get('/', async (req, res) => {
    try {
        const imageUrls = await fetchUnsplashImages('tattoo', 70);
        res.render("begin.ejs", { imageUrls: imageUrls });
    } catch (error) {
        console.error("Error in home route:", error);
        res.status(500).send("Er is een fout opgetreden bij het laden van de startpagina");
    }
});

app.get('/register', (req, res) => res.render("register.ejs"));

app.post('/register', async (req, res) => {
  try {
      console.log("Ontvangen registratiegegevens:", req.body);
      const collection = db.collection('users');
      const { username, email, password, confirmPassword } = req.body;

      // Validatiestappen blijven hetzelfde
      // ...

      // Nieuwe gebruiker aanmaken
      const hashedPassword = await hashPassword(password);
      const sanitizedUsername = xss(username);
      const newUser = { 
          username: sanitizedUsername.trim(), 
          email: email.trim().toLowerCase(), 
          password: hashedPassword 
      };

      const result = await collection.insertOne(newUser);
      console.log("Nieuwe gebruiker aangemaakt met ID:", result.insertedId);

      // Redirect naar home.ejs met gebruikersnaam
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

app.get('/log-in', (req, res) => res.render("log-in.ejs"));

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
        // Store user information in session
        req.session.user = {
          id: user._id,
          username: user.username,
          email: user.email
        };
        res.render("index.ejs", { username: user.username });
      } else {
        res.status(400).send("Incorrect wachtwoord");
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Er is een fout opgetreden bij het inloggen");
    }
    
  });
  
  // Route for posts
  app.get('/post', (req, res) => {
    res.render('post.ejs');
  });
  
  // Route for artists
  app.get('/artiesten', (req, res) => {
    res.render('artiesten.ejs');
  });
  
  // Route for "see all" page
  app.get('/zie-alle', (req, res) => {
    res.render('zie-alle.ejs');
  });
  
  // Route for detail page
  app.get('/detail/:id', (req, res) => {
    res.render('detailpagina', { id: req.params.id });
  });
  
  // Route for preview page
  app.get('/preview', (req, res) => {
    res.render('preview');
  });

  // Route for index
  app.get('/index', (req, res) => {
    res.render('index.ejs');
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

// Server starten
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});