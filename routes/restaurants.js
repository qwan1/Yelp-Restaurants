var express = require("express");
var router  = express.Router();
var Restaurant = require("../models/restaurant");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserRestaurant, checkUserComment, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all restaurants
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all restaurants from DB
      Restaurant.find({name: regex}, function(err, allRestaurants){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allRestaurants);
         }
      });
  } else {
      // Get all restaurants from DB
      Restaurant.find({}, function(err, allRestaurants){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allRestaurants);
            } else {
              res.render("restaurants/index",{restaurants: allRestaurants, page: 'restaurants'});
            }
         }
      });
  }
});

//CREATE - add new restaurant to DB
router.post("/", isLoggedIn, isSafe, function(req, res){
  // get data from form and add to restaurants array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newRestaurant = {name: name, image: image, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    // Create a new restaurant and save to DB
    Restaurant.create(newRestaurant, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to restaurants page
            console.log(newlyCreated);
            res.redirect("/restaurants");
        }
    });
  });
});

//NEW - show form to create new restaurant
router.get("/new", isLoggedIn, function(req, res){
   res.render("restaurants/new");
});

// SHOW - shows more info about one restaurant
router.get("/:id", function(req, res){
    //find the restaurant with provided ID
    Restaurant.findById(req.params.id).populate("comments").exec(function(err, foundRestaurant){
        if(err || !foundRestaurant){
            console.log(err);
            req.flash('error', 'Sorry, that restaurant does not exist!');
            return res.redirect('/restaurants');
        }
        console.log(foundRestaurant)
        //render show template with that restaurant
        res.render("restaurants/show", {restaurant: foundRestaurant});
    });
});

// EDIT - shows edit form for a restaurant
router.get("/:id/edit", isLoggedIn, checkUserRestaurant, function(req, res){
  //render edit template with that restaurant
  res.render("restaurants/edit", {restaurant: req.restaurant});
});

// PUT - updates restaurant in the database
router.put("/:id", isSafe, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location, lat: lat, lng: lng};
    Restaurant.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, restaurant){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/restaurants/" + restaurant._id);
        }
    });
  });
});

// DELETE - removes restaurant and its comments from the database
router.delete("/:id", isLoggedIn, checkUserRestaurant, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.restaurant.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.restaurant.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Restaurant deleted!');
            res.redirect('/restaurants');
          });
      }
    })
});

module.exports = router;
