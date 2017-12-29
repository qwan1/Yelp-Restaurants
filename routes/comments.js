const express = require("express");
const router  = express.Router({mergeParams: true});
const Restaurant = require("../models/restaurant");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find restaurant by id
    console.log(req.params.id);
    Restaurant.findById(req.params.id, function(err, restaurant){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {restaurant: restaurant});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn, function(req, res){
   //lookup restaurant using ID
   Restaurant.findById(req.params.id, function(err, restaurant){
       if(err){
           console.log(err);
           res.redirect("/restaurants");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               restaurant.comments.push(comment);
               restaurant.save();
               console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/restaurants/' + restaurant._id);
           }
        });
       }
   });
});

router.get("/:commentId/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {restaurant_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/restaurants/" + req.params.id);
       }
   });
});

router.delete("/:commentId", isLoggedIn, checkUserComment, function(req, res){
  // find restaurant, remove comment from comments array, delete comment in db
  Restaurant.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/restaurants/" + req.params.id);
        });
    }
  });
});

module.exports = router;
