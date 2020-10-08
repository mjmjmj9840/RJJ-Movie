const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
require('dotenv').config();

var app = express();

// Load Module
app.set('view engine', 'ejs');

// Static File
app.use(express.static('public'));

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connect and Set
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
  useCreateIndex: true,
});

// Movie Schema
const moviesSchema = new mongoose.Schema({
  title: String,
  en_title: String,
  year: String,
  date: String,
  genre: Array,
  content: String,
  rating: Number,
});

const Movie = new mongoose.model('Movie', moviesSchema);

// Home Route
app.get('/', function (req, res) {
  Movie.find({ rating: { $gte: 8.5 } }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('home', { movies: movies });
    }
  });
});

// Year Route
app.get('/year', function (req, res) {
  Movie.find({ year: '2020' }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('year', { movies: movies });
    }
  });
});

// Genre Route
app.get('/genre', function (req, res) {
  /*
  Movie.find({}, function (err, movies) {
    if (err) return console.error(err);
    res.render('genre', { movies: movies });
  });
  */
});

// Search Route
app.post('/search', function (req, res) {
  const search = req.body.search;
  let no_data = 0;

  Movie.find({ title: search }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      // 찾는 데이터가 없을 경우
      if (movies.length == 0) {
        no_data = 1;
      }

      console.log(no_data);
      console.log(search);
      console.log(movies);

      res.render('search', { search: search, no_data: no_data, movies: movies });
    }
  });
});

// Recommed Route
app.get('/popular', function (req, res) {
  Movie.findOne({ title: '오!문희' }, function (err, movie) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('popular', { movie: movie });
    }
  });
});

// Starting Server
let port = process.env.PORT;

app.listen(port, function () {
  console.log('Server started successfully.');
});
