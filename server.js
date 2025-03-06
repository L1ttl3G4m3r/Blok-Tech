require('dotenv').config();

const express = require('express');
const app = express();
const port = 9000;

const xss = require('xss');
const validator = require('validator');

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
  res.render("register.ejs")
}

async function onregister(req, res){
  console.log(req.body);

  try{
    const collection = db.collection('users');
    const formData = req.body;
    const result = await collection.insertOne(formData);
    res.render("klaar.ejs", req.body);
  } catch(error){
    console.error("Error occurred while inserting:", error);
    res.status(500).send("An error occurred");
  }
}

app.get("/", onhome);
app.post("/register", onregister);

