const Product = require("../models/product");

exports.createProduct = (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const product = new Product({
    name: req.body.name,
    category: req.body.category,
    imagePath: url + "/images/" + req.file.filename,
    owner_id: req.userData.userId,
    descripition: req.body.descripition,
    status: req.body.status,
    price: req.body.price
  });
  product.save()
    .then(createdProduct => {
      res.status(201).json({
        message: "producted added successfully",
        product: {
          ...createdProduct,
          id: createdProduct._id
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Adding a product failed!"
      });
    });
};

exports.updateProduct = (req, res, next) => {
  let imagePath = req.body.imagePath;
  if (req.file) {
    const url = req.protocol + "://" + req.get("host");
    imagePath = url + "/images/" + req.file.filename;
  }
  const product = new Product({
      name: req.body.name,
      status: req.body.status,
      category: req.body.category,
      descripition: req.body.descripition,
      imagePath: imagePath,
      price: req.body.price
    });

  if(req.userData.role == 0){
      Product.updateOne({_id: req.params.id, owner_id: req.userData.userId}, product)
      .then(result => {

          if (result.n > 0){
              res.status(200).json({ message: "Update successful!" });
          } else {
              res.status(401).json({ message: "Not authorized!" });
           }
      })
      .catch(error => {
          res.status(500).json({message: "Couldn't udpate product!" });
      });
  }
  else{
      Product.updateOne({_id: req.params.id}, product)
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
exports.getProducts = function(keyword = ''){
  
  return (req, res, next) => {
    let condition = {};
    if(keyword == 'user'){
      condition = {owner_id: req.userData.userId};
    }
    else if(keyword == 'guest'){
      condition = {buyed: 0};
    }
    else if(keyword == 'purchases'){
      condition = {buyer: req.userData.userId};
    }
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const productQuery = Product.find(condition);
    let fetchedProducts;
    if (pageSize && currentPage) {
        productQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
    }
    productQuery
        .then(products => {
          fetchedProducts = products;
        return Product.count(condition);
        })
        .then(count => {
        res.status(200).json({
            message: "Produts fetched successfully!",
            products: fetchedProducts,
            maxProducts: count
        });
        })
        .catch(error => {
        res.status(500).json({
            message: "Fetching Product failed!"
        });
    });
  };
};

exports.getProduct = (req, res, next) => {
  Product.findById(req.params.id)
  .then(product => {
    if(product)
      res.status(200).json(product);
    else 
      res.status(404).json({ message: "user not found!" });
    })
  .catch(error => {
    res.status(500).json({
      message: "Fetching Product failed!"
    })
  })
};

exports.deleteProduct = (req, res, next) => {

  if(req.userData.role == 0){
      Product.deleteOne({_id: req.params.id, owner_id: req.userData.userId})
      .then(result => {
          if (result.n > 0){
              res.status(200).json({ message: "Deletion successful!" });
          } else {
              res.status(401).json({ message: "Not authorized!" });
           }
      })
      .catch(error => {
          res.status(500).json({message: "Couldn't delete product!" });
      });
  }
  else{
      Product.deleteOne({_id: req.params.id})
      .then(result => {

          if (result.n > 0){
              res.status(200).json({ message: "deletion successful!" });
          } else {
              res.status(401).json({ message: "Not authorized!" });
          }
      })
      .catch(error => {
          res.status(500).json({message: "Couldn't delete user!" });
      });
  }
};

exports.buyProduct = (req, res, next) => {
 
  Product.updateOne({ _id: req.params.id, buyed:0 }, {"$set": {"buyer": req.userData.userId, "buyed":1 }} )
  .then(result => {
    if (result.n > 0) {
      console.log(result);
      console.log(req.userData.userId)
      res.status(200).json({ message: "buyed successful!" });
    } else {
      res.status(401).json({ message: "Not authorized!" });
    }
  })
  .catch(error => {
    res.status(500).json({
      message: "Couldn't buy it!"
    });
  });

};
