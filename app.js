const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const { PythonShell } = require('python-shell');
require('dotenv').config();

var app = express();

// Load Module
app.set('view engine', 'ejs');

// Static File
app.use(express.static('public'));

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

// Crawling Movies
PythonShell.run('./python/naver_movie.py', null, function (err, data) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(data);
});

// MongoDB Connect and Set
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
  useCreateIndex: true,
});

// Movie Schema
const moviesSchema = new mongoose.Schema({
  no: Number,
  title: String,
  imgURL: String,
  genre: Array,
  date: Date,
  point: String,
  director: Array,
  cast: Array,
});

const Movie = new mongoose.model('Movie', moviesSchema);

// 전역 변수
var year_ago_date, year_ago;

// 1 year ago
year_ago_date = new Date();
year_ago = year_ago_date.getFullYear() - 1;

/*
// 하루에 한 번 실행되는 함수
setInterval(function () {
  // 1 year ago
  year_ago_date = new Date();
  year_ago = year_ago_date.getFullYear() - 1;
}, 86400000);

*/

// Home Route
app.get('/', function (req, res) {
  // 1 year ago movies
  Movie.find(
    {
      date: {
        $gte: new Date(year_ago, 1, 1, 0, 0, 0, 0),
        $lte: new Date(year_ago, 12, 31, 0, 0, 0, 0),
      },
    },
    function (err, ago_movies) {
      if (err) {
        console.log(err);
        return;
      } else {
        // this week movies (ranking 1~10)
        Movie.find({ no: { $lte: 10 } }, function (err, weekly_movies) {
          if (err) {
            console.log(err);
            return;
          } else {
            res.render('home', {
              year_ago: year_ago,
              ago_movies: ago_movies,
              weekly_movies: weekly_movies,
            });
          }
        });
      }
    }
  );
});

// Year Route
app.get('/year/:yearID', function (req, res) {
  const requestedID = req.params.yearID;
  let year_start = new Date(requestedID, 1, 1, 0, 0, 0, 0);
  let year_end = new Date(requestedID, 12, 31, 0, 0, 0, 0);

  Movie.find({ date: { $gte: year_start, $lte: year_end } }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('year', { year: requestedID, movies: movies });
    }
  });
});

app.post('/year', function (req, res) {
  const yearID = req.body.year;

  res.redirect('/year/' + yearID);
});

// Genre Route
app.get('/genre/:genreID', function (req, res) {
  const requestedID = req.params.genreID;

  const genre = [
    '드라마',
    '판타지',
    '공포',
    '멜로/로맨스',
    '모험',
    '스릴러',
    '다큐멘터리',
    '코미디',
    '가족',
    '애니메이션',
    '범죄',
    '액션',
    '에로',
  ];

  Movie.find({ genre: genre[requestedID] }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('genre', { genre: genre, genreID: requestedID, movies: movies });
    }
  });
});

app.post('/genre', function (req, res) {
  const genreID = req.body.genre;

  res.redirect('/genre/' + genreID);
});

// Search Route
app.post('/search', function (req, res) {
  const search = req.body.search;
  let no_data = 0;

  Movie.find({ title: { $regex: search } }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      // 찾는 데이터가 없을 경우
      if (movies.length == 0) {
        no_data = 1;
      }

      res.render('search', { search: search, no_data: no_data, movies: movies });
    }
  });
});

// Popular Route
app.get('/popular', function (req, res) {
  Movie.find({ no: { $gte: 1, $lte: 50 } }, function (err, movies) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('popular', { movies: movies });
    }
  });
});

// Detail Route
app.get('/detail/:movieID', function (req, res) {
  const requestedID = req.params.movieID;

  Movie.findOne({ _id: requestedID }, function (err, movie) {
    if (err) {
      console.log(err);
      return;
    } else {
      res.render('detail', { movie: movie });
    }
  });
});

// Starting Server
let port = process.env.PORT;

app.listen(port, function () {
  console.log('Server started successfully.');
});
