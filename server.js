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