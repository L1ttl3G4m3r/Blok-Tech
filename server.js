require('dotenv').config();

const express = require('express');
const app = express();
const port = 9000;

const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

app.listen(port, () => {
  console.log(`Connected to port ${port}`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs')
   .set('views', 'views');
app.use("/static", express.static("static"));

const { MongoClient, ObjectId } = require('mongodb')
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);
const collection = db.collection(process.env.DB_collection)

async function run(){
  try {
    await client.connect();
    console.log("Client connected to database");
  } catch (error) {
    console.log(error);
  }
}

run();

/////////
//API'S//
/////////
const fetch = require('node-fetch');
const unsplashApiKey = process.env.UNSPLASH_API_KEY;

async function fetchUnsplashImages(query, count = 70) {
  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&count=${count}`, {
      headers: {
        'Authorization': `Client-ID ${unsplashApiKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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

app.get('/begin', async (req, res) => {
  console.log('Received request for /begin route');
  const imageUrls = await fetchUnsplashImages('tattoo', 28);
  console.log(`Retrieved ${imageUrls.length} image URLs`);
  if (imageUrls.length > 0) {
    console.log('First image URL:', imageUrls[0]);
  }
  console.log('Rendering begin.ejs with imageUrls:', imageUrls);
  res.render('begin', { imageUrls: imageUrls });
});


async function onhome(req, res) {
  console.log('Fetching Unsplash images...');
  const imageUrls = await fetchUnsplashImages('tattoo', 70);
  console.log('Received image URLs:', imageUrls);
  res.render("begin.ejs", { imageUrls: imageUrls });
}

function onRegisterPage(req, res) {
  res.render("register.ejs");
}

async function onRegister(req, res) {
  try {
    const collection = db.collection('users');
    const { username, email, birthdate, password, confirmPassword } = req.body;

    // Valideer de invoer
    if (!validator.isEmail(email)) {
      return res.status(400).send("Ongeldig e-mailadres");
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
    }

    if (password !== confirmPassword) {
      return res.status(400).send("Wachtwoorden komen niet overeen");
    }

    // Controleer of de gebruiker 18+ is
    const birthDate = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      return res.status(400).send("Je moet 18 jaar of ouder zijn om te registreren");
    }

    // Controleer of de gebruiker al bestaat
    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Er is een probleem met dit e-mailadres. Probeer een ander of neem contact op.");
    }

    // Hash het wachtwoord
    const hashedPassword = await hashPassword(password);

    // Sanitize invoervelden
    const sanitizedUsername = xss(username);

    // Maak het gebruikersobject
    const newUser = {
      username: sanitizedUsername,
      email: email,
      birthdate: birthdate,
      password: hashedPassword
    };

    // Voeg de nieuwe gebruiker toe aan de database
    const result = await collection.insertOne(newUser);
    res.render("klaar.ejs", { 
      username: sanitizedUsername,
      birthdate: newUser.birthdate,
      email: email,
      password: password
     });
  } catch (error) {
    console.error("Error occurred while inserting:", error);
    res.status(500).send("Er is een fout opgetreden");
  }
}

function onRegisterPageArtists(req, res) {
  res.render("registerArtists.ejs");
}

async function onRegisterArtists(req, res) {
  try {
    const collection = db.collection('artists');
    const { username, email, password, confirmPassword, studio } = req.body;

    // Valideer de invoer
    if (!validator.isEmail(email)) {
      return res.status(400).send("Ongeldig e-mailadres");
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
    }

    if (password !== confirmPassword) {
      return res.status(400).send("Wachtwoorden komen niet overeen");
    }

    // Controleer of de gebruiker al bestaat
    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Er is een probleem met dit e-mailadres. Probeer een ander of neem contact op.");
    }

    // Hash het wachtwoord
    const hashedPassword = await hashPassword(password);

    // Sanitize invoervelden
    const sanitizedUsername = xss(username);

    // Maak het gebruikersobject
    const newUser = {
      username: sanitizedUsername,
      email: email,
      password: hashedPassword,
      studio: studio
    };

    // Voeg de nieuwe gebruiker toe aan de database
    const result = await collection.insertOne(newUser);
    res.render("klaar.ejs", { 
      username: sanitizedUsername,
      birthdate: newUser.birthdate,
      email: email,
      password: password
     });
  } catch (error) {
    console.error("Error occurred while inserting:", error);
    res.status(500).send("Er is een fout opgetreden");
  }
}

app.get("/", onhome);
app.get("/register", onRegisterPage);
app.post("/register", onregister);

//////////////////////
//Camera integration//
//////////////////////
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post("/upload", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const newImage = {
      filename: req.file.originalname,
      path: req.file.path,
      createdAt: new Date()
    };

    const result = await db.collection('images').insertOne(newImage);
    res.json({ message: 'File uploaded successfully', imageId: result.insertedId });
  } catch (error) {
    console.error("Error occurred while uploading:", error);
    res.status(500).send("Er is een fout opgetreden bij het uploaden");
  }

app.post("/register", onRegister);
app.get("/registerArtists", onRegisterPageArtists);
app.post("/registerArtists", onRegisterArtists);

app.use((req, res, next) => {
  res.status(404).send('404 - Pagina niet gevonden');
  console.log(`404 Error: ${req.originalUrl}`);
});