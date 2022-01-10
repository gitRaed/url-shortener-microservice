require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const bodyParser = require('body-parser');
//const dns = require('dns');
const mongoose = require('mongoose');
//const validUrl = require('valid-url');

//mongoose configuration
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//mongoose connection
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
  console.log('Finally connected man !!..finally');
});

//mongoose schema configuration
const Schema = mongoose.Schema;

const urlSchema = new Schema({ 
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }
});

const urlModel = mongoose.model('url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

app.post('/api/shorturl', function(req, res, next){

  /*const options = {
    all: true,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  dns.lookup('freeCodeCamp.org',options, (err, result) => {
    if(err) {console.log(err);};

    console.log(result);
    next();
  });*/

  //take url from the body and create a number for the output
  const inputUrl = req.body.url;
  const outputUrl = Math.floor(Math.random() * 10000).toString();

  // create a new url model
  const data = new urlModel({
    original_url: inputUrl,
    short_url: outputUrl
  });

  // save data newly created 
  data.save(err => {
    if(err) {
      res.send('Error saving DB');
    }
  });

  //check if the url is valid, if yes send data
  if (!validURL(inputUrl)){
    res.json({ error: 'Invalid Url' });
  } else {
      res.json(data);
  }
});

app.get('/api/shorturl/:url', (req, res, next) => {
  
  const url = req.params.url;

  //find if url param matches a short_url value in our mongodb
  urlModel.findOne({ short_url: url }, (err, data) => {

    //if data doesn't exist, send error, else redirect
    if(!data) {
      res.json({error: 'Invalid Url'});
    } else {
      const regex = new RegExp('^(http|https)://', 'i');
      const originalURL = data.original_url;

      if (err) {
        res.json({ error: 'Error reading database' }); 
      };

      if (regex.test(originalURL)) {
        res.redirect(301, data.original_url);
      } else {
        res.redirect(301, `http://${data.longURL}`); 
      }
    }

  });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
