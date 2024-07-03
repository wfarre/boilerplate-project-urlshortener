require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");
const UrlModel = require("./models/urlSchema");

const db = mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const foundUrl = await UrlModel.findOne({ short_url: shortUrl });
  if (foundUrl) res.redirect(foundUrl.original_url);
  else res.send({ error: "Couldn't find the URL" });
});

app.post("/api/shorturl", async (req, res, next) => {
  const originalUrl = req.body.url;

  if (
    !originalUrl.includes("https://") &&
    !originalUrl.includes("http://") &&
    originalUrl.split("")[originalUrl.length] === "/"
  )
    return res.send({ error: "Invalid url" });

  const url =
    req.body.url.split("https://")[1] || req.body.url.split("http://")[1];

  dns.lookup(url, async (err, value) => {
    if (err) {
      res.send({ error: "Invalid url" });
      return;
    }

    let foundUrl = await UrlModel.findOne({ original_url: originalUrl })
      .then((url) => url)
      .catch((err) => console.log(err));

    if (foundUrl)
      res.send({
        original_url: foundUrl.original_url,
        short_url: foundUrl.short_url,
      });
    else {
      let shortenUrl = 1;

      shortenUrl = await UrlModel.estimatedDocumentCount()
        .then((docCount) => docCount + 1)
        .catch((err) => console.log(err));

      const NewShortenUrl = new UrlModel({
        original_url: originalUrl,
        short_url: shortenUrl,
      });

      NewShortenUrl.save();

      res.send({
        original_url: NewShortenUrl.original_url,
        short_url: NewShortenUrl.short_url,
      });
    }
  });
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
