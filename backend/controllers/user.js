const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.createUser =  (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
   .then(hash => {
       const user = new User({
       name : req.body.name,
       email: req.body.email,
       password : hash
   });
   user.save()
   .then(result => {
       res.status(201).json({
           msg: 'User Created ..!',
           result: result
       });
   })
   .catch(err => {
       res.status(500).json({
           message:"Invalid authentication credentials!"
       });
   });
});
};

exports.userLogin = (req, res, next) => {
    let fetchedUser;
    User.findOne({email: req.body.email })
    .then(user => {

        if(!user){
            return res.status(401).json({
                message : "Auth Field"
            });
        }
        fetchedUser = user;
        return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
        if(!result){
            return res.status(401).json({
                message : " Wrong Password! ... Auth Field "
            });
        }
        const token = jwt.sign(
            {email : fetchedUser.email, id:fetchedUser._id, role:fetchedUser.role },
            process.env.JWT_KEY,
            {expiresIn: "1h"}
        );
        res.status(200).json({
            token: token,
            expiresIn: 3600,
            userId: fetchedUser._id,
            userRole: fetchedUser.role
        });
        console.log(token);
    })
    .catch(err=> {
        res.status(401).json({
            message: "Invalid authentication credentials!"
        });
    });
};

exports.getUsers = (req, res, next) => {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const userQuery = User.find({role:0});
    let fetchedUsers;
    if (pageSize && currentPage) {
        userQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
    }
    userQuery
        .then(users => {
        fetchedUsers = users;
        return User.count({role:0});
        })
        .then(count => {
        res.status(200).json({
            message: "Users fetched successfully!",
            users: fetchedUsers,
            maxUsers: count
        });
        })
        .catch(error => {
        res.status(500).json({
            message: "Fetching users failed!"
        });
    });
};

exports.getUser = (req, res, next) => {
    User.findById(req.params.id)
      .then(user => {
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ message: "user not found!" });
        }
      })
      .catch(error => {
        res.status(500).json({
          message: "Fetching user failed!"
        });
      });
  };

exports.deleteUser = (req, res, next) => {
    User.deleteOne({_id: req.params.id, role:0 })
    .then(result => {
        if(result.n > 0){
            res.status(200).json({ message: "Deletion successful!" });
        }
        else{
            res.status(401).json({ message: "Not authorized !.." });
        }
    })
    .catch(error=> {
        res.status(500).json({
            message:"Deleting user failed!"
        });
    });
};

exports.editUser = (req, res, next) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
      });

    if(req.userData.role == 0){
        User.updateOne({$and : [{_id: req.params.id}, {_id: req.userData.userId}]}, user)
        .then(result => {

            if (result.n > 0){
                res.status(200).json({ message: "Update successful!" });
            } else {
                res.status(401).json({ message: "Not authorized!" });
             }
        })
        .catch(error => {
            res.status(500).json({message: "Couldn't udpate user!" });
        });
    }
    else{
        User.updateOne({_id: req.params.id}, user)
        .then(result => {

            if (result.n > 0){
                res.status(200).json({ message: "Update successful!" });
            } else {
                res.status(401).json({ message: "Not authorized!" });
            }
        })
        .catch(error => {
            res.status(500).json({message: "Couldn't udpate user!" });
        });
    }
};