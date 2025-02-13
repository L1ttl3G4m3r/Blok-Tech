const express = require('express');
const app = express();

app.get('/', home);
app.get('/about', about);
app.listen(8000);

function home(req, res) {
    res.send('<h1>Hello</h1>');
}

function about(req, res) {
    res.send('<h1>About</h1>');
}