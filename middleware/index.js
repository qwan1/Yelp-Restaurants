var Comment = require('../models/comment');
var Restaurant = require('../models/restaurant');
module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  },
  checkUserRestaurant: function(req, res, next){
    Restaurant.findById(req.params.id, function(err, foundRestaurant){
      if(err || !foundRestaurant){
          console.log(err);
          req.flash('error', 'Sorry, that restaurant does not exist!');
          res.redirect('/restaurants');
      } else if(foundRestaurant.author.id.equals(req.user._id) || req.user.isAdmin){
          req.restaurant = foundRestaurant;
          next();
      } else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/restaurants/' + req.params.id);
      }
    });
  },
  checkUserComment: function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect('/restaurants');
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/restaurants/' + req.params.id);
       }
    });
  },
  isSafe: function(req, res, next) {
        next();
    // If we don't allow random URLs, use the following code:
    //
    // if(req.body.image.match(/^https:\/\/images\.unsplash\.com\/.*/)) {
    //   next();
    // }else {
    //   req.flash('error', 'Only images from images.unsplash.com allowed.\nSee https://youtu.be/Bn3weNRQRDE for how to copy image urls from unsplash.');
    //   res.redirect('back');
    // }
  }
}
