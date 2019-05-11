'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns')
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});


app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser')
//app.use(bodyParser.urlencoded({extended: false}))
var urlencodedParser = bodyParser.urlencoded({extended: false})

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

//mongoDB Schema
var urlSchema = new mongoose.Schema({
  url: String,
  id: Number
})
var urlModel = mongoose.model('urlModel', urlSchema)

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.get("/api/shorturl/:id", function(req, res) {
  //search through database for url
  urlModel.findOne({id: req.params.id}, function(err, data){
    if (err) {
      res.send("error opening page")
    }
    else {console.log("no error")
      // if data exists redirect if not return no shorturl
      if (data) {
        var redirecturl = "https://".concat(data.url)
        res.redirect(redirecturl)
      }
      else {res.json({error: "No short url found for given input"})}
    }

  })
})


//req.body.url stores the url we're posting to mongoDB
app.post('/api/shorturl/new', urlencodedParser, function(req, res) {
  var url = req.body.url
  //strip http:// or https:// so dns.lookup works.. add "www." for database consistency and less storage
  url = url.replace(/^https?:\/\//, "")
  if (!/^www./.test(url)) {
    url = "www.".concat(url)
  }
  
  //if valid url do stuff if not return error
  var test = dns.lookup(url, function lookup(err, address, family){
    //if invalid url return error
    if (err) {
      res.json({error: "invalid url"})
    }
    //search through database for url
    else {
      var urlexist = urlModel.findOne({url: url}, function(err,data) {
        if (err) return console.log("error finding person")
        else {
          //if url exists then return url if not create & save new schema
          if (data) {
            res.json({original_url: url, short_url: data.id})
          }
          else {
            //find max id# in database then set new id
            urlModel.countDocuments({}, function(err, count) {
              var newurl = new urlModel({
                url: url,
                id: count+1
              })
              newurl.save(function(err,data) {
                if (err) return console.log(err);
                return data
              })
              res.json({original_url: url, short_url: count+1})
            })
            
          }
        }
      })
      
    }
  })
}) 


app.listen(port, function () {
  console.log('Node.js listening ...');
});