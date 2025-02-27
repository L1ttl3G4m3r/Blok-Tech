require('dotenv').config() 

const express = require('express')
const app = express()

app
  .use(express.urlencoded({extended: true}))
  .use(express.static('static'))
  .set('view engine', 'ejs')
  .set('views', 'view')

const { MongoClient, ServerApiVersion, ObjectId, Collection } = require('mongodb')
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
})

client.connect()
  .then(() => {
    console.log('Database connection established')
  })
  .catch((err) => {
    console.log(`Database connection error - ${err}`)
    console.log(`For uri - ${uri}`)
  })

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use((req, res) => {
  console.error('404 error at URL: ' + req.url)
  res.status(404).send('404 error at URL: ' + req.url)
})

app.use((err, req, res) => {
  console.error(err.stack)
  res.status(500).send('500: server error')
})

app.listen(process.env.PORT, () => {
  console.log(`Now my webserver is listening at port ${process.env.PORT}`)
})