require('dotenv').config();
const express = require('express');
const app = express();
const port = 9000;
const xss = require('xss');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Import the crypto module
const nodemailer = require('nodemailer'); // Import nodemailer

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: 'your-email@gmail.com', // Your email address
        pass: 'your-email-password' // Your email password or app-specific password
    }
});

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
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
    .set('views', 'views');
app.use("/static", express.static("static"));

const { MongoClient, ObjectId } = require('mongodb')
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);
const collection = db.collection(process.env.DB_collection)

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

/////////
//API'S//
/////////

const fetch = require('node-fetch');
const unsplashApiKey = process.env.UNSPLASH_API_KEY;

async function fetchUnsplashImage(query) {
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&client_id=${unsplashApiKey}`);
        if (!response.ok) {
            throw new Error('Unsplash API request failed');
        }
        const data = await response.json();
        return data.urls.regular;
    } catch (error) {
        console.error('Error fetching Unsplash image:', error);
        return null;
    }
}

app.get('/unsplash-image', async (req, res) => {
    const query = req.query.query || 'nature';
    const imageUrl = await fetchUnsplashImage(query);
    if (imageUrl) {
        res.json({ imageUrl });
    } else {
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

function onhome(req, res) {
    res.render("register.ejs")
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

async function onregister(req, res) {
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
            //DO NOT SEND PASSWORD
        });
    } catch (error) {
        console.error("Error occurred while inserting:", error);
        res.status(500).send("Er is een fout opgetreden");
async function onRegister(req, res) {
  try {
    const collection = db.collection('users');
    const { username, email, birthdate, password, confirmPassword } = req.body;

    // Valideer de invoer
    if (!validator.isEmail(email)) {
      return res.status(400).send("Ongeldig e-mailadres");
    }
}

function onloginpage(req, res) {
    res.render("log-in.ejs");
}

async function onlogin(req, res) {
    try {
        const collection = db.collection('users');
        const { email, password } = req.body;
        // Zoek de gebruiker in de database
        const user = await collection.findOne({ email: email });
        if (!user) {
            return res.status(400).send("Gebruiker niet gevonden");
        }
        // Vergelijk het ingevoerde wachtwoord met het gehashte wachtwoord in de database
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Wachtwoord is correct
            res.render("home.ejs", { username: user.username });
        } else {
            // Wachtwoord is incorrect
            res.status(400).send("Incorrect wachtwoord");
        }
    } catch (error) {
        console.error("Error occurred during login:", error);
        res.status(500).send("Er is een fout opgetreden");
    }
}

// Forgot Password Route
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password.ejs');
});

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const collection = db.collection('users');
        const user = await collection.findOne({ email });

        if (!user) {
            return res.status(400).send("Er is geen account met dit e-mailadres.");
        }

        // Generate a unique reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set token expiration (e.g., 1 hour)
        const resetPasswordExpires = Date.now() + 3600000;

        // Save the token and expiration to the user document
        await collection.updateOne(
            { email: email },
            { $set: { resetPasswordToken: resetToken, resetPasswordExpires: resetPasswordExpires } }
        );

        // Send reset password email
        const resetUrl = `http://localhost:${port}/reset-password/${resetToken}`; // Replace with your actual domain
        const mailOptions = {
            to: email,
            from: 'christiandewith@outlook.com', // Your email address
            subject: 'Wachtwoord Resetten',
            html: `<p>Je hebt een wachtwoord reset aangevraagd.</p>
                   <p>Klik op de volgende link om je wachtwoord te resetten:</p>
                   <a href="${resetUrl}">${resetUrl}</a>
                   <p>Deze link is 1 uur geldig.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).send("Er is een fout opgetreden bij het verzenden van de e-mail.");
            }
            console.log('Email sent: ' + info.response);
            res.send("Een e-mail is verzonden met instructies om uw wachtwoord te resetten.");
        });

    } catch (error) {
        console.error("Error occurred during forgot password:", error);
        res.status(500).send("Er is een fout opgetreden");
    }
});

// Reset Password Route
app.get('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const collection = db.collection('users');

        const user = await collection.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send("Wachtwoord reset token is ongeldig of verlopen.");
        }

        res.render('reset-password.ejs', { token }); // Render the reset password page with the token

    } catch (error) {
        console.error("Error occurred during reset password get:", error);
        res.status(500).send("Er is een fout opgetreden");
    }
});

app.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const collection = db.collection('users');

        const user = await collection.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send("Wachtwoord reset token is ongeldig of verlopen.");
        }

        if (!validator.isLength(password, { min: 8 })) {
            return res.status(400).send("Wachtwoord moet minimaal 8 tekens lang zijn");
        }

        const hashedPassword = await hashPassword(password);

        await collection.updateOne(
            { email: user.email },
            {
                $set: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null }
            }
        );

        res.send("Uw wachtwoord is succesvol gereset.");

    } catch (error) {
        console.error("Error occurred during reset password post:", error);
        res.status(500).send("Er is een fout opgetreden");
    }
});

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
app.get("/log-in", onloginpage)
app.post("/log-in", onlogin);
app.post("/register", onregister);
app.get("/register", onRegisterPage);
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
  require('dotenv').config();

const express = require('express');
const app = express();
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs')
   .set('views', 'views');
app.use("/static", express.static("static"));


async function run() {
  try {
    await client.connect();
    console.log("Client connected to database");
  } catch (error) {
    console.log(error);
  }
}

run();

// Route voor de homepagina (index.ejs)
app.get("/", (req, res) => {
  res.render("index");
});

// Route voor het registerformulier (register.ejs)
app.get("/register", (req, res) => {
  res.render("register");
});

// Route om formuliergegevens op te slaan en "klaar.ejs" te tonen
async function onhome2(req, res) {
  console.log(req.body);

  try {
    const collection = db.collection('users');
    const formData = req.body;
    const result = await collection.insertOne(formData);
    res.render("klaar", req.body);
  } catch (error) {
    console.error("Error occurred while inserting:", error);
    res.status(500).send("An error occurred");
  }
}

app.post("/klaar", onhome2);
app.post("/index", onhome2);

app.listen(port, () => {
  console.log(`Connected to port ${port}`);
});
