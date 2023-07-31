require('dotenv').config();
const express = require('express');
// const mongo =  require('mongodb');
const mongoose = require('mongoose');
// const validUrl = require('valid-url');
const dns = require('dns');
const urlparser = require('url');
const shortId = require('shortid');
const cors = require('cors');
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

const  uri = process.env.DB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
});

const connection = mongoose.connection;

connection.on('error', console.error.bind(console, 'Connnection  error: '));
connection.once('open', () => {
  console.log("MongoDB connected successfully");
})




app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema);




app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});




app.post('/api/shorturl', async function(req, res) {

  const url_input = req.body.url_input
  const urlCode = shortId.generate()

  // check if the url is valid or not

  const checkaddress = dns.lookup(urlparser.parse(url_input).hostname, async (err, address) => {
    if(!address) {
      res.json({error: 'invalid url'})
    } else {
      try {
        // check if its already in the database
        let findOne = await URL.findOne({
          original_url: url_input
        })
        if(findOne) {
          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url
          })
        } else {
          // if its not exist yet then create new one and response with the result
          findOne = new URL({
            original_url: url_input,
            short_url: urlCode
          })
          await findOne.save()
          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url
          })
        }
      } catch(err) {
        console.error(err)
        res.status(500).json('Error encountered...')
      }
    }
  })

  // if(!validUrl.isWebUri(url_input)) {
  //   res.status(401).json({
  //     error: 'invalid url'
  //   })
  // } else {
  //   try {
  //     // check if its already in the database
  //     let findOne = await URL.findOne({
  //       original_url: url_input
  //     })
  //     if(findOne) {
  //       res.json({
  //         original_url: findOne.original_url,
  //         short_url: findOne.short_url
  //       })
  //     } else {
  //       // if its not exist yet then create new one and response with the result
  //       findOne = new URL({
  //         original_url: url_input,
  //         short_url: urlCode
  //       })
  //       await findOne.save()
  //       res.json({
  //         original_url: findOne.original_url,
  //         short_url: findOne.short_url
  //       })
  //     }
  //   } catch(err) {
  //     console.error(err)
  //     res.status(500).json('Error encountered...')
  //   }
  // }
})

app.get('/api/shorturl/:short_url?', async function(req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json('No URL found')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json('Error encountered...')
  }
})





app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
