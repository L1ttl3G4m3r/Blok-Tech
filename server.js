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

function onhome(req, res) {
  res.render("begin.ejs")
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
      return res.status(400).send("E-mailadres is al in gebruik");
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

app.get("/", onhome);
app.get("/register", onRegisterPage);
app.post("/register", onregister);