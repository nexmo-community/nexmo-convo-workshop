# Making and receiving phone calls with the Nexmo Voice API

## Run ngrok

```
$ ngrok http 3000
```

## Create a Voice Application

```
$ nexmo app:create "A Voice Application" YOUR_NGROK_URL/webhooks/answer YOUR_NGROK_URL/webhooks/events  --keyfile=private.key
```

## Buy a Nexmo phone number

```
$ nexmo number:buy  --country_code AU
```

## Make a phone call

### Install node dependencies

```
$ npm init
$ npm install nexmo
```

### Initialize dependencies

Create an `index.js` file:

```
$ touch index.js
```

Initialize the Nexmo node library in the `index.js` file you created:

```javascript
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET,
  applicationId: NEXMO_APPLICATION_ID,
  privateKey: NEXMO_APPLICATION_PRIVATE_KEY_PATH
})
```

### Make a phone call

```javascript
nexmo.calls.create({
  to: [{
    type: 'phone',
    number: TO_NUMBER
  }],
  from: {
    type: 'phone',
    number: NEXMO_NUMBER
  },
  ncco: [{
    action: "talk",
    voiceName: "Nicole",
    text: "What do you get if you cross a telephone with an iron? A smooth operator!"
  }]
})
```

### Run the application

```
$ node index.js
```

## Receive a phone call

### Create a web server

Create an express application

```
$ npm install express body-parser
```

Replace the contents of `index.js` with:

```javascript
const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.listen(3000)
```

### Create webhooks for the answer and event url

```javascript
app.get('/webhooks/answer', (req, res) => {
  const ncco = [{
      action: 'talk',
      voiceName: 'Nicole',
      text: 'What do you get if you cross a telephone with an iron? A smooth operator!'
    }
  ]

  res.json(ncco)
})

app.post('/webhooks/events', (req, res) => {
  console.log(req.body)
  res.send(200);
})

```

### Link number

```
$ nexmo link:app YOUR_NEXMO_NUMBER YOUR_APPLICATION_ID
```

### Run the application

```
$ node index.js
```
