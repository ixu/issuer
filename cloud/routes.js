// initialize some Parse Object classes so we can use them throughout
var Card = Parse.Object.extend("Card");
var UserCard = Parse.Object.extend("UserCard");

// Shows the form to create a new meme
// get '/'
exports.index = function(req, res) {
  // If the user is not logged in, redirect them to the login page
  if (!Parse.User.current()) {
    res.redirect('/login');
  }
  var cardQuery = new Parse.Query(Card);
  var user = Parse.User.current();
  cardQuery.equalTo('user', user);
  cardQuery.find().then(function(cardObjs){
    console.log(cardObjs);
    res.render('index', {
      user: user,
      cards: cardObjs
    });
  });
};

// Shows the login screen
// get '/login'
exports.showLogin = function(req, res) {
  res.render('login', {
  });
};

// Processes a login or signup request
// post '/login'
exports.loginOrSignup = function(req, res) {
  if (req.body.action == "signup") {
    var user = new Parse.User();
    // Use email address as username
    user.set("username", req.body.email);
    user.set("email", req.body.email);
    user.set("password", req.body.password);

    // Sign up the user and redirect them to the main page, at exports.index above
    user.signUp().then(function(userObj) {
      res.redirect('/');
    }, function(error) {
      res.render('login', {});
      //res.send("Error: " + error.code + " " + error.message);
    });
  } else if (req.body.action == "login") {
    // Login the user and redirect them to the main page if successful
    Parse.User.logIn(req.body.email, req.body.password).then(function(userObj) {
      res.redirect('/');
    }, function(error) {
      res.render('login', {});
      //res.send("Error: " + error.code + " " + error.message);
    });
  } else {
    res.render('login', {});
    //res.send("Error, login or signup not specified");
  }
};

// Logs the user out, then redirects to the login screen
// get '/logout'
exports.logout = function(req, res) {
  Parse.User.logOut();
  res.redirect("/login");
};

// Shows the profile for :userId
// get '/profile/:userId'
exports.profile = function(req, res) {
  // get the user objectID from the url parameter :userId
  var userId = req.params.userId;
  var user = Parse.User.current();
  var query = new Parse.Query(Parse.User);
  var appointmentQuery = new Parse.Query(Appointment);
  appointmentQuery.equalTo('user', user);
  var appointmentObjs;
  appointmentQuery.find().then(function(a){
    appointmentObjs = a;
  });
  query.get(userId).then(function(userObj) {
    var query = new Parse.Query(Snapshot);
    query.equalTo("user", userObj);
    // include the photo field in the query so that it fetches all the content from the Photo object as well
    query.include("photo");
    user = userObj;
    return query.find();
  }).then(function(snapshotObjs) {
    var userInfoQuery = new Parse.Query(UserInfo);
    userInfoQuery.equalTo("user", user);
    // pass the meme objects to profile.ejs
    userInfoQuery.first().then(function (userInfoObj) {
      res.render('profile', {
        user: user,
        snapshots: snapshotObjs,
        userInfo: userInfoObj,
        appointments: appointmentObjs
      });
    })
    
  });
};

// Shows the profile page for the current user
// get '/me'
exports.me = function(req, res) {
  var user = Parse.User.current();
  if (!user) {
    // if the user is not logged in, redirect to the login page
    res.redirect('/login');
  } else {
    // if the user is logged in, redirect to their profile page
    res.redirect('/profile/' + user.id);
  }
};

// Creates a new UserCard Object
// post '/card'
exports.create = function(req, res) {
  // create a new Meme Parse Object
  var userCard = new UserCard();
  var userQuery = new Parse.Query(Parse.User);
  userQuery.get(req.body.userId).then(function(userObj) {
    userCard.set('user', userObj);
    userCard.set('exp', req.body.exp);
    userCard.set('number', req.body.number);
    userCard.set('url', req.body.url);
    var cardQuery = new Parse.Query(Card);
    cardQuery.get(req.body.card).then(function(cardObj){
      userCard.set('card', cardObj);
      userCard.save().then(function(userCardObj) {
        res.redirect("/");
      }, function(error) {
        console.log(error);

      });
    }, function(error) {
      console.log(error);
    });
    
  }, function(error) {
    console.log(error);

  });
};

// Show a single user's cards
// get '/user/:objectId/'
exports.show = function(req, res) {
  // get the meme's objectId from the url param :objectId
  var objectId = req.params.objectId;
  var query = new Parse.Query(UserCard);
  query.equalTo("user", objectId);

  var innerQuery = new Parse.Query(Card)
  innerQuery.equalTo("user", Parse.User.current());

  query.matchesQuery("card", innerQuery);

  query.find().then(function(cardsObj) {
    res.render('show', {
      cards: cardsObj,
      userId: objectId
    });
  });
}

// Add a new card
exports.scan = function(req, res) {
  res.render('scan', {cardId: req.params.objectId});
}

exports.addinfo = function(req, res) {
  res.render('addinfo', {
    cardId: req.body.card,
    userId: req.body.userId
  });


}

exports.add = function(req, res) {
  var card = new Card();
  card.set("user", Parse.User.current());
  card.set("name", req.body.cardname);
  card.set("description", req.body.carddescription);
  card.save().then(function(cardObj) {
    res.redirect("/");
  });
  
}

exports.verify = function(req, res) {
  res.render('verify', {});
}

exports.usercard = function(req, res) {
  var usercardId = req.params.objectId;
  var query = new Parse.Query(UserCard);
  query.get(usercardId).then(function(usercardObj){
    res.render('usercard', {
      usercard: usercardObj
    })
  }, function(error) {
    res.redirect("/");
  })
}

exports.users = function(req, res) {
  var user = Parse.User.current();
  var usercardId = req.params.objectId;
  var query = new Parse.Query(UserCard);
  query.include("user");
  query.include("card");
  
  var innerQuery = new Parse.Query(Card);
  innerQuery.equalTo("user", user);


  query.matchesQuery("card", innerQuery);
  query.find().then(function(usercardObjs) {
    res.render('users', {
      usercards: usercardObjs
    });
  });


}


