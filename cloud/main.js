require('cloud/app.js');

var Meme = Parse.Object.extend("Meme");
var Snapshot = Parse.Object.extend("Snapshot");

// Use a beforeSave to convert the text fields for the Meme to upper case.
Parse.Cloud.beforeSave("Meme", function(request, response) {
  var memeObj = request.object;
  var topText = memeObj.get("top");
  var bottomText = memeObj.get("bottom");
  var topTextCaps = topText.toUpperCase();
  var bottomTextCaps = bottomText.toUpperCase();
  memeObj.set("top", topTextCaps);
  memeObj.set("bottom", bottomTextCaps);
  response.success();
});

// Increment the "numMemes" counter for the user who created the meme
Parse.Cloud.afterSave("Meme", function(request) {
  // Only increment the user's numMemes if this Meme object is new
  if (!request.object.existed()) {
    var query = new Parse.Query(Parse.User);
    var userId = request.object.get("user").id;
    query.get(userId).then(function(userObj) {
      userObj.increment("numMemes");
      userObj.save();
    });
  }
});

// Increment the "views" counter on the meme object
// This function must be called with params {memeId}
Parse.Cloud.define("incMemeViews", function(request, response) {
  var query = new Parse.Query(Meme);
  var memeId = request.params.memeId;
  query.get(memeId).then(function(memeObj) {
    memeObj.increment("views");
    return memeObj.save();
  }).then(function() {
    response.success();
  }, function(error) {
    response.error("Could not increment views: " + error.message);
  });
});
