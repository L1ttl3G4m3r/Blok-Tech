const { MongoClient } = require("mongodb");
const uri = PerformanceObserverEntryList.env.URI;
const client = new MongoClient(uri);
const db = client.db(process.env.DB_NAME);

async function connectDB(){
  try {
    await client.connect();
    console.log("Client connected to database");
  } catch (error) {
    console.log(error);
  }
}

connectDB();

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use("/static", express.static("static"));

app.get("/", home);
app.get("/about", about);
app.listen(8000);

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "views");

// Route voor het tonen van de homepagina
function home(req, res) {
  res.send("<h1>Hello</h1>");
}

// Route voor het tonen van de about-pagina
function about(req, res) {
  res.send("<h1>About</h1>");
}

// Route voor het tonen van het formulier
app.get("/add", (req, res) => {
  res.render("add");
});

// Route voor het verwerken van de POST-verzoek van het formulier
app.post("/submit", (req, res) => {
  const { gebruikersnaam, wachtwoord } = req.body;

  // Lees de credentials.json om de geldige gegevens te krijgen
  fs.readFile(path.join(__dirname, "credentials.json"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading credentials file:", err);
      return res.status(500).send("Server error.");
    }

    const validCredentials = JSON.parse(data); // Zet de JSON-data om in een object

    // Vergelijk de ingevoerde gegevens met de geldige gegevens
    if (gebruikersnaam === validCredentials.gebruikersnaam && wachtwoord === validCredentials.wachtwoord) {
      // Als de gegevens overeenkomen, toon de welkomstpagina
      res.render("response", { gebruikersnaam });
    } else {
      // Als de gegevens niet overeenkomen, toon een foutmelding
      res.render("foutmelding");
    }
  });
});

// Route voor het tonen van het profiel van de gebruiker
app.get("/profile/:username", (req, res) => {
  const username = req.params.username.toLowerCase();

  if (!users.includes(username)) {
    return res.status(404).send("Error 404: User not found");
  }

  let movie = {
    title: "The Shawshank Redemption",
    description: "Andy Dufresne is a young and ambitious banker sentenced to life in prison...",
  };

  // Render de EJS template voor movie details
  res.render("detail", { data: movie, username });
});

const users = ["kaylee", "tess"];