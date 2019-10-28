const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const graphqlHttp = require('express-graphql');

const graphqlSchema = require('./backend/graphql/schema');
const graphqlResolver = require('./backend/graphql/resolvers');

const auth = require("./backend/middleware/auth");


const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.use("/images", express.static(path.join("backend/images")));

mongoose.connect('mongodb://localhost/check-list', { useNewUrlParser: true })
.then(() => {
  console.log('connect to check-list  DB ');
  
}).catch(() => {
  console.log("Connection Failed");
});

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json()); 

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
  });

  app.use(auth);

  app.use(
    '/graphql',
   graphqlHttp({
     schema: graphqlSchema,
     rootValue: graphqlResolver,
     graphiql: true,
     formatError(err){
        if (!err.originalError){
          return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
      }
    })
  );

  // const server = app.listen(3000);
  // const io = require('./socket').init(server);
  //   io.on('connection', socket => {
  //     console.log('Client connected');
  // });
  app.listen(3000);
