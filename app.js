const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { PythonShell } = require('python-shell');
const schedule = require('node-schedule');
require('dotenv').config();

var app = express();

// Load Module
app.set('view engine', 'ejs');

// Static File
app.use(express.static('public'));

// Initialize Session and Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));

// Scheduling Crawling
const j = schedule.scheduleJob('00 00 00 * * *', function () {
  PythonShell.run('./python/naver_movie.py', null, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(data);
  });
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

// User Schema
const userSchema = new mongoose.Schema({
  userID: String,
  like: Array,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

// Passport Configure Strategy
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://rojinjin-moive.herokuapp.com/login/google/callback',
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOrCreate({ username: profile.emails[0].value, userID: profile.id }, function (
        err,
        user,
      ) {
        return done(err, user);
      });
    },
  ),
);

// for calculate 1 year ago
var year_ago_date, year_ago;
year_ago_date = new Date();
year_ago = year_ago_date.getFullYear() - 1;

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
            if (req.isAuthenticated()) {
              res.render('home', {
                headerName: 'header-login',
                year_ago: year_ago,
                ago_movies: ago_movies,
                weekly_movies: weekly_movies,
                user_movies: req.user.like,
              });
            } else {
              res.render('home', {
                headerName: 'header',
                year_ago: year_ago,
                ago_movies: ago_movies,
                weekly_movies: weekly_movies,
                user_movies: [],
              });
            }
          }
        });
      }
    },
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
      if (req.isAuthenticated()) {
        res.render('year', { headerName: 'header-login', year: requestedID, movies: movies });
      } else {
        res.render('year', { headerName: 'header', year: requestedID, movies: movies });
      }
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
      if (req.isAuthenticated()) {
        res.render('genre', {
          headerName: 'header-login',
          genre: genre,
          genreID: requestedID,
          movies: movies,
        });
      } else {
        res.render('genre', {
          headerName: 'header',
          genre: genre,
          genreID: requestedID,
          movies: movies,
        });
      }
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

      if (req.isAuthenticated()) {
        res.render('search', {
          headerName: 'header-login',
          search: search,
          no_data: no_data,
          movies: movies,
        });
      } else {
        res.render('search', {
          headerName: 'header',
          search: search,
          no_data: no_data,
          movies: movies,
        });
      }
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
      if (req.isAuthenticated()) {
        res.render('popular', {
          headerName: 'header-login',
          movies: movies,
        });
      } else {
        res.render('popular', {
          headerName: 'header',
          movies: movies,
        });
      }
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
      if (req.isAuthenticated()) {
        res.render('detail', {
          headerName: 'header-login',
          movie: movie,
          user_movies: req.user.like,
        });
      } else {
        res.render('detail', {
          headerName: 'header',
          movie: movie,
          user_movies: [],
        });
      }
    }
  });
});

// Scrap Route
app.get('/scrap', function (req, res) {
  if (!req.isAuthenticated()) {
    res.send('<script>alert("로그인이 필요합니다. "); window.location.href = "/login"; </script>');
  } else {
    const userLike = req.user.like;

    Movie.find({ title: { $in: userLike } }, function (err, movies) {
      if (err) {
        console.log(err);
        return;
      } else {
        res.render('scrap', {
          headerName: 'header-login',
          movies: movies,
          user_movies: req.user.like,
        });
      }
    });
  }
});

app.post('/like', function (req, res) {
  if (!req.isAuthenticated()) {
    res.send('<script>alert("로그인이 필요합니다. "); window.location.href = "/login"; </script>');
  } else {
    const movieTitle = req.body.like;
    const requestUser = req.user.userID;

    User.updateOne({ userID: requestUser }, { $push: { like: [movieTitle] } }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/scrap');
      }
    });
  }
});

app.post('/dislike', function (req, res) {
  if (!req.isAuthenticated()) {
    res.send('<script>alert("로그인이 필요합니다. "); window.location.href = "/login"; </script>');
  } else {
    const movieTitle = req.body.dislike;
    const requestUser = req.user.userID;

    User.updateOne({ userID: requestUser }, { $pull: { like: movieTitle } }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/scrap');
      }
    });
  }
});

// Login Route
app.get('/login', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('login', { headerName: 'header-login' });
  } else {
    res.render('login', { headerName: 'header' });
  }
});

// Google Login
app.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/login/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/',
  }),
);

// Logout
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// Starting Server
let port = process.env.PORT;

app.listen(port, function () {
  console.log('Server started successfully.');
});
