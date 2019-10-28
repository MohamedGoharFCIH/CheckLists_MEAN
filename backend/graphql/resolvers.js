const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const List = require('../models/list');
const Comment = require('../models/comment');

isAuth = (req) => {
  if (!req.isAuth) {
    const error = new Error('Not authenticated!');
    error.code = 401;
    throw error;
  }
};

isAuthorized = (id, req) => {
  if (id.toString() !== "5d9b1ba35827fb09b0210193") { //5d96528f0a7ceb1f940d8134
    const error = new Error('Not authorized!');
    error.code = 403;
    throw error;
  }
};

getList = async function(id, req)  {
  
  const listFetched = await List.findById(id).populate('owner_id', 'name');
  await isAuthorized(listFetched.owner_id.id, req);
  if (!listFetched) {
    const error = new Error('No List found!');
    error.code = 404;
    throw error;
  }
  return listFetched;
};

getComment = async function(id, req) {

  const commentFetched = await Comment.findById(id).populate('list');
  await isAuthorized(commentFetched, req);
  if (!commentFetched) {
    const error = new Error('No Comment found!');
    error.code = 404;
    throw error;
  }
  
};

validateListInput = (listInput)=>{
  dateTime = new Date();
  const errors = [];
    if (
      validator.isEmpty(listInput.name) ||
      !validator.isLength(listInput.name, { min: 3 })
    ) {
      errors.push({ message: 'name is invalid.' });
    }
    if ( validator.isEmpty(listInput.content) ) {
      errors.push({ message: 'content is Empty .' });
    }
    endDate = new Date(listInput.expireDate);
    if(endDate <= dateTime){
      errors.push({ message: 'date is invalid.' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

};

validateUserInput = (userInput) => {
  const errors = [];
  if(!validator.isEmail(userInput.email)){
      errors.push({ message: 'E-Mail is invalid.' });
  }
  if(
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, {min : 5} )
  ){
      errors.push({message : 'Password too short!' });
  }
  if(errors.length > 0){
      err = new Error("Invalid Input");
      err.data = errors;
      err.code = 422;
      throw err;
  }
};

module.exports = {
    createUser : async function({ userInput }, req){
      await validateUserInput(userInput);
        const existingUser = await User.findOne({email: userInput.email});
        if(existingUser){
            err = new Error("User exists ");
            throw err;
        }
        const hashedPw = await bcrypt.hash(userInput.password, 12);
        const user = new User({
        email: userInput.email,
        name: userInput.name,
        password: hashedPw
        });
        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };


    },
    login : async function({ email, password}){
        const user = await User.findOne({email: email});
        if(!user){
            err = new Error('User not found !');
            err.code = 401;
            throw err;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if(!isEqual){
            err = new Error('Password is incorrect !');
            err.code = 401;
            throw err;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        },
        process.env.JWT_KEY,
        {expiresIn : '1h'}

        );
    return { token, userId: user.id.toString()};
    },
    loginWithGoogle: async function(){

    },

    editAccount: async function({name, password}, req){
      await isAuth(req.userId);
      const errors = [];
      const user = await User.findById(req.userId);
      await isAuthorized(user._id, req.userId);
      if ( validator.isEmpty(name) ) {
        errors.push({ message: 'name is Empty .' });
      }
     

      if (validator.isEmpty(password) ) {
        user.password = user.password;
      }
      else if( !validator.isLength(password, {min : 5} )){
        errors.push({ message: 'password is Too Short! .' });
      }
      if (errors.length > 0) {
        const error = new Error('Invalid input.');
        error.data = errors;
        error.code = 422;
        throw error;
      }

      const isEqual = await bcrypt.compare(password, user.password);
      if
      ( 
        user.name === name
         && 
        ( 
          isEqual
          || 
          validator.isEmpty(password) 
        ) 
      ){
          
        return {...user._doc};
      }

      hashPW = await bcrypt.hash(password, 12);
      user.password = hashPW;

      user.name = name;
      const editedUser = await user.save();
      return{
        ...editedUser._doc
      };

    },

    createList: async function({ listInput }, req){
      var dateTime = new Date();
        await isAuth(req);
        validateListInput(listInput);
          // console.log(endDate.toUTCString());
          // console.log(dateTime);
          
         
          const user = await User.findById("5d9b1ba35827fb09b0210193"); //"5d9b1ba35827fb09b0210193"
          if (!user) {
            const error = new Error('Invalid user.');
            error.code = 401;
            throw error;
          }
          const list = new List({
            name: listInput.name,
            content: listInput.content,
            owner_id: user,
            expireDate: listInput.expireDate 
          });

          const createdList = await list.save();
          user.lists.push(createdList);
          await user.save();
          return {
            ...createdList._doc,
            _id: createdList._id.toString(),
            createdAt: createdList.createdAt.toISOString(),
            expireDate: createdList.expireDate.toISOString()
          };
    },

    list: async function({id}, req){
      await isAuth(req);
      const listFetched = await getList(id, req);
      await isAuthorized(listFetched.owner_id.id, req);
      return listFetched;
        

    },

     findLists: async function({listType}, req){
       var dateTime = new Date();
        await isAuth(req);
        let condition = {};
        if(listType == 'all'){
          condition = {owner_id: req.userId}; //5d9b1ba35827fb09b0210193
        }
        else if(listType == 'old'){
           
          condition = {expireDate: {$lt: dateTime}, owner_id: req.userId}
        }
        else if(listType == 'current'){
          condition = {expireDate: {$gt: dateTime}, owner_id:  req.userId};
        }
        else {
          condition = {owner_id:  req.userId};
        }
        
        listsCount = await List.find(condition).countDocuments();
        currentPage = +req.query.page;
        pageSize = +req.query.pagesize;
        let lists = await List.find(condition).populate('owner_id', 'name');

        if(currentPage && pageSize){
          lists = await List.find(condition)
          .sort({updatedAt: -1})
          .skip(pageSize * (currentPage - 1))
          .limit(pageSize)
          .populate('owner_id', 'name');
          
        }
      console.log(lists);
        return {
          lists: lists.map(list =>{
            return{
              ...list._doc,
              _id:list._id,
              createdAt: list.createdAt,   
            };
          }),
          listsCount : listsCount
        };
    },

    listsByDate : async function({selectedDate}, req){
        //await isAuth(req);
        day = new Date(selectedDate);
        nextDay = date.add(1).day();
        console.log(date);
        listsCount = await List.find({expireDate: {"$gte": day, "$lt": nextDay }, owner_id: req.userId}).populate('owner_id', 'name').countDocuments();
        currentPage = +req.query.page;
        pageSize = +req.query.pagesize;
        let lists = await List.find({expireDate: date}).populate('owner_id', 'name');
        if(currentPage && pageSize){
          lists = await List.find({expireDate: date})
          .sort({updatedAt: -1})
          .skip(pageSize * (currentPage - 1))
          .limit(pageSize)
          .populate('owner_id', 'name');
          
        }
      console.log(lists);
        return {
          lists: lists.map(list =>{
            return{
              ...list._doc,
              _id:list._id,
              createdAt: list.createdAt.toISOString(),   
            };
          }),
          listsCount : listsCount
        };
    },
    updateList : async function({id, listInput}, req){
      
      await isAuth(req);
      const myList = await getList(id, req);
      console.log(myList);
      await isAuthorized(myList.owner_id.id, req);
      validateListInput(listInput);
      myList.name = listInput.name;
      myList.content = listInput.content;
      myList.expireDate = listInput.expireDate;

      const updatedList = await myList.save();
  
      return {
        ...updatedList._doc
      }
      
    },

    checkList: async function({id, keyword='check'}, req){
      await isAuth(req);
      const list = await await getList(id, req);
      await isAuthorized(list.owner_id.id, req);
      if(keyword == 'uncheck')
        list.done = 0;
      else 
        list.done = 1;

      const updatedList = await list.save();
      
      return {
        ...updatedList._doc
      }

    },

    deleteList: async function({id}, req){
      await isAuth(req);
      const listToDelete = await getList(id, req);
      console.log(listToDelete);
      await isAuthorized(listToDelete.owner_id.id, req);
      await List.findByIdAndDelete(id);
      const user = await User.findById("5d9b1ba35827fb09b0210193");
      user.lists.pull(id);
      await user.save(); 
      return true;
    },

    addComment: async function({comment}, req){
      const errors = [];
      await isAuth(req);
      const  myList = await this.list(req.params.listID, req);
      await isAuthorized(myList.owner_id.id, req);
      if (validator.isEmpty(comment) ) {
        errors.push({ message: 'comment is Empty .' });
      }
      if (errors.length > 0) {
        const error = new Error('Invalid input.');
        error.data = errors;
        error.code = 422;
        throw error;
      }
      const Newcomment = new Comment({
        comment: comment,
        list: myList
      });

      const createdComment = await Newcomment.save();
      myList.comments.push(createdComment);
      console.log(myList.type);
      await myList.save();
      return {
        ...createdComment._doc,
        _id: createdComment._id.toString(),
      };

    },

    deleteComment: async function({id}, req){
      await isAuth(req);
      const commentToDelete = await getComment(id, req);
      console.log(commentToDelete);
      await isAuthorized(commentToDelete, req);
      await Comment.findByIdAndDelete(id);
      const list = await List.findById(req.params.listID);
      list.comments.pull(id);
      await list.save(); 
      return true;
    },

    editComment: async function({id, commentInput}, req){
     await isAuth(req);
     const comment = await getComment(id, req);
     await isAuthorized(comment.list.owner_id.id, req);
     const errors = [];
      if ( validator.isEmpty(commentInput) ) {
        errors.push({ message: 'comment is Empty .' });
      }
        
      if (errors.length > 0) {
        const error = new Error('Invalid input.');
        error.data = errors;
        error.code = 422;
        throw error;
      }

      if (comment.comment === commentInput){
        return {...comment._doc};
      }
   
      comment.comment = commentInput;
      const updatedComment = await comment.save();
  
      return {
        ...updatedComment._doc
      }
    },
  
  }