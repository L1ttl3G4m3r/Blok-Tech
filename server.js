require('dotenv').config();
const express = require('express');
const app = express();
const port = 9000;
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const multer = require('multer');

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

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

// Database connectie
async function run() {
    try {
        await client.connect();
        console.log("Client connected to database");
    } catch (error) {
        console.log(error);
        run();
    }
}

run();

// Routes
app.get('/', async (req, res) => {
    const imageUrls = await fetchUnsplashImages('tattoo', 70);
    res.render("begin.ejs", { imageUrls: imageUrls });
});

app.get('/register', (req, res) => res.render("register.ejs"));

app.post('/register', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { username, email, birthdate, password, confirmPassword } = req.body;

        // Validatie
        if (!validator.isEmail(email)) return res.status(400).send("Ongeldig e-mailadres");
        if (!validator.isLength(password, { min: 8 })) return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
        if (password !== confirmPassword) return res.status(400).send("Wachtwoorden komen niet overeen");

        // Leeftijdscontrole
        const birthDate = new Date(birthdate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (age < 18 || (age === 18 && monthDiff < 0)) return res.status(400).send("Je moet 18 jaar of ouder zijn om te registreren");

        // Controleer of de gebruiker al bestaat
        const existingUser = await collection.findOne({ email: email });
        if (existingUser) return res.status(400).send("Er is een probleem met dit e-mailadres. Probeer een ander of neem contact op.");

        // Nieuwe gebruiker aanmaken
        const hashedPassword = await hashPassword(password);
        const sanitizedUsername = xss(username);
        const newUser = { username: sanitizedUsername, email, birthdate, password: hashedPassword };
        await collection.insertOne(newUser);

        res.render("klaar.ejs", { username: sanitizedUsername, birthdate, email });
    } catch (error) {
        console.error("Error occurred while inserting:", error);
        res.status(500).send("Er is een fout opgetreden");
    }
});

app.get('/log-in', (req, res) => res.render("log-in.ejs"));

app.post('/log-in', async (req, res) => {
    try {
        const collection = db.collection('users');
        const { email, password } = req.body;
        const user = await collection.findOne({ email: email });
        if (!user) return res.status(400).send("Gebruiker niet gevonden");
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.render("home.ejs", { username: user.username });
        } else {
            res.status(400).send("Incorrect wachtwoord");
        }
    } catch (error) {
        console.error("Error occurred during login:", error);
        res.status(500).send("Er is een fout opgetreden");
    }
});

// Wachtwoord vergeten en reset routes
app.get('/forgot-password', (req, res) => res.render('forgot-password.ejs'));

app.post('/forgot-password', async (req, res) => {
    // Implementatie van wachtwoord vergeten functionaliteit
});

app.get('/reset-password/:token', async (req, res) => {
    // Implementatie van wachtwoord reset pagina
});

app.post('/reset-password/:token', async (req, res) => {
    // Implementatie van wachtwoord reset functionaliteit
});

// Artiesten registratie routes
app.get("/registerArtists", (req, res) => res.render("registerArtists.ejs"));

app.post("/registerArtists", async (req, res) => {
    // Implementatie van artiesten registratie
});

// Bestandsupload route
const upload = multer({ dest: 'uploads/' });
app.post("/upload", upload.single('image'), async (req, res) => {
    // Implementatie van bestandsupload
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).send('404 - Pagina niet gevonden');
    console.log(`404 Error: ${req.originalUrl}`);
});

// Server starten
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});