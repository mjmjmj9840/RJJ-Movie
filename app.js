const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
require('dotenv').config();

var app = express();

// Load Module
app.set('view engine', 'ejs');

// Static File
app.use(express.static('public'));

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
  year: String,
  genre: Array,
  content: String,
  rating: Number,
});

const Movie = new mongoose.model('Movie', moviesSchema);

// Movie Data 예시로 넣기
/*
const movie1 = new Movie({
  title: '오!문희',
  year: '2020.09.02',
  genre: ['코미디', '드라마'],
  content:
    '평화로운 금산 마을. 불같은 성격에 가족 사랑도 뜨거운 "두원"(이희준)에게 하나뿐인 딸 "보미"가...',
  rating: 9.16,
});

movie1.save();

const movie2 = new Movie({
  title: '테넷',
  year: '2020.08.26',
  genre: ['액션'],
  content:
    '시간의 흐름을 뒤집는 인버전을 통해 현재와 미래를 오가며 세상을 파괴하려는 사토르(케네스...',
  rating: 8.8,
});

movie2.save();

*/

// Home Route
app.get('/', function (req, res) {
  res.render('home');
});

// Year Route
app.get('/year', function (req, res) {
  Movie.find({}, function (err, movies) {
    if (err) return console.error(err);
    res.render('year', { movies: movies });
  });
});

// Genre Route
app.get('/genre', function (req, res) {
  Movie.find({}, function (err, movies) {
    if (err) return console.error(err);
    res.render('genre', { movies: movies });
  });
});

// Search Route
app.get('/search', function (req, res) {
  res.render('search');
});

// Recommed Route
app.get('/recommend', function (req, res) {
  res.render('recommend');
});

// Starting Server
let port = process.env.PORT;

app.listen(port, function () {
  console.log('Server started successfully.');
});
