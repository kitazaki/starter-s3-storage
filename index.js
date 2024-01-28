const express = require('express')
const app = express()
const AWS = require("aws-sdk");
const mime = require("mime-types");
const s3 = new AWS.S3()
//const bodyParser = require('body-parser');

//app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// curl -i https://some-app.cyclic.app/myFile.txt
app.get('*', async (req,res) => {
  let filename = req.path.slice(1)

  try {
    let s3File = await s3.getObject({
      Bucket: process.env.CYCLIC_BUCKET_NAME,
//      Bucket: process.env.BUCKET,
      Key: filename,
    }).promise()

//    console.log(s3File);
    const contentType = mime.lookup(filename);
    const body = contentType.match(/^text\//) ? s3File.Body.toString() : s3File.Body;

    res.set('Content-type', s3File.ContentType)
    res.set('CacheControl', 'no-cache');
    res.send(body).end()
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      console.log(`No such key ${filename}`)
      res.sendStatus(404).end()
    } else {
      console.log(error)
      res.sendStatus(500).end()
    }
  }
})


// curl -i -XPUT --data '{"k1":"value 1", "k2": "value 2"}' -H 'Content-type: application/json' https://some-app.cyclic.app/myFile.txt
app.put('*', async (req,res) => {
  let filename = req.path.slice(1)

  console.log(typeof req.body)
  console.log(express.json(req.body));
  console.log(filename);
  const contentType = mime.lookup(filename);

  await s3.putObject({
    Body: JSON.stringify(req.body),
//    Body: contentType.match(/^text\//) ? req.body.toString() : req.body,
    Bucket: process.env.CYCLIC_BUCKET_NAME,
//    Bucket: process.env.BUCKET,
    Key: filename,
    ContentType: contentType,
  }).promise()

  res.set('Content-type', 'text/plain')
  res.send('ok').end()
})

// curl -i -XDELETE https://some-app.cyclic.app/myFile.txt
app.delete('*', async (req,res) => {
  let filename = req.path.slice(1)

  await s3.deleteObject({
    Bucket: process.env.BUCKET,
    Key: filename,
  }).promise()

  res.set('Content-type', 'text/plain')
  res.send('ok').end()
})

// /////////////////////////////////////////////////////////////////////////////
// Catch all handler for all other request.
app.use('*', (req,res) => {
  res.sendStatus(404).end()
})

// /////////////////////////////////////////////////////////////////////////////
// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening at http://localhost:${port}`)
})



