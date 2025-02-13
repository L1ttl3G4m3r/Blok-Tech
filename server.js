const express = require("express");
const app = express();

app.use("/static", express.static("static"));

app.get("/", home);
app.get("/about", about);
app.listen(8000);

function home(req, res) {
  res.send("<h1>Hello</h1>");
}

function about(req, res) {
  res.send("<h1>About</h1>");
}

app.set("view engine", "ejs");
app.set("views", "views");

const users = ["kaylee", "tess"];

app.get("/profile/:username", (req, res) => {
  const username = req.params.username.toLowerCase();

  if (!users.includes(username)) {
    return res.status(404).send("Error 404: User not found");
  }

  let movie = {
    title: "The Shawshank Redemption",
    description: "Andy Dufresne is a young and ambitious banker sentenced to life in prison...",
  };

  // Render the EJS template correctly
  res.render("detail", { data: movie, username });
});