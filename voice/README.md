# Making and receiving phone calls with the Nexmo Voice API

We'll be using the Nexmo Voice API to make and receive calls programmatically. There are a few things we need to do before we can make our first phone call.

## Run ngrok

In order to receive phone calls, we'll need to have our local web server exposed to the internet. Instead of deploying it to somewhere like heroku, we'll install ngrok. ngrok is a tunneling application that exposes your local environment to the internet. It's all fine for testing, but please don't use this behind secure networks, most policies disallow tunneling by default.

Once you've installed it, we will start it, and tell it to tunnel port 3000 to http. That will give you a publicly accessible URL for your local server running on port 3000, something that looks like this: http://66a728b9.ngrok.io. Don't worry, we don't have a local webserver running yet, but we'll start all our express servers later to run on port 3000.

```
$ ngrok http 3000
```

## Create a Voice Application

To interact with the Voice API, we'll need to create a voice application on the Nexmo platform to authenticate our requests. Think of applications more like containers, metadata to group all your data on the Nexmo platform. We'll create one using the CLI, and that needs a name, and answer URL and an event URL. We'll also save a keyfile on disk. Applications work on a public / private key system, so when you create an application, a public key is generated and kept with Nexmo, and a private key is generated, not kept with Nexmo, and returned to you via the creation call. We'll use the private key to authenticate our library calls later on.

Use the ngrok URL you got in the previous step and fill in the command before running it. When a call is happening on a Nexmo number, the data about the call is sent to the event URL. When you've got an incoming call to a Nexmo number, the system gets your answer URL in order to figure out what to do with the call, how to manage it.

```
$ nexmo app:create "A Voice Application" YOUR_NGROK_URL/webhooks/answer YOUR_NGROK_URL/webhooks/events  --keyfile=private.key
```

## Buy a Nexmo phone number

In order to interact with the Nexmo Voice API, we'll need a phone number on the Nexmo platform as well. We'll buy one using the CLI, and we're going to buy an Australian number. If you have a phone number from a different country and no roaming plans, buy a number for your country instead, replacing `AU` with your country code.

```
$ nexmo number:buy  --country_code AU
```

## Make a phone call

We're going to make a phone call using the number we just bought and the Nexmo Voice API. There are different ways we can do this, we're going to opt for making one without the need for an answer URL, instead sending the necessary data when we make the call request.

### Install node dependencies

First off, initialize a NPM package, otherwise, older versions of NPM will complain about installing a package without having a package.json first. Just use the defaults for init, and then install the nexmo node.js package.

```
$ npm init
$ npm install nexmo
```

### Initialize dependencies

We'll create a new JavaScript file, let's call it `index.js`.

```
$ touch index.js
```

We need to initialize the Nexmo node library we installed earlier, in the `index.js` file you created:

```javascript
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET,
  applicationId: NEXMO_APPLICATION_ID,
  privateKey: NEXMO_APPLICATION_PRIVATE_KEY_PATH
})
```

Replace the values in there with your actual API key and secret, the application id for the application you just created earlier, and the path to the private key you saved.

### Make a phone call

In order to make a phone call, we need to call one of the methods from the library. `nexmo.calls.create` takes an object parameter, and passes that on to the API. The `from` property is an array with a single object, of type phone, and the number being the Nexmo number you rented on the platform. `to` is similar, except the number should be the one you're trying to call. I'll use mine here for example. The `ncco` property is what drives the call. It's called a  Nexmo Call Control Object, and it's a json structure with instructions for the call. Here I'm using the talk action, using the voice `Nicole` (the Australian female voice) and making it say the text there. There are more options available for the voiceName, as well as other actions the NCCO accepts. I strongly recommend taking a look at the [NCCO reference](https://developer.nexmo.com/voice/voice-api/ncco-reference) on the Nexmo Developer Platform.

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

Now that we created our application, the only thing needed to make the call is running the code. So go ahead and run it with node, and you should be getting a call from the Nexmo number.

```
$ node index.js
```

## Receive a phone call

While making a phone call needs an API call to the Nexmo platform, using our node library, receiving a phone call doesn't need an API call. Whenever your Nexmo number receives a phone call, the platform goes and gets your answer URL, and then drives the call based on the NCCO found there.

Because the Nexmo platform makes the requests to the answer and event URLs, those need to be publicly accessible on the internet, and that's why we're using ngrok. We'll need to create a web server that can respond to a GET request on that answer URL and listen for POST requests on that event URL.

### Create a web server

We'll be creating our webserver using express because it's one of the most popular and easy to use node frameworks for this purpose. We'll also be looking at the request bodies for the event URL, so we'll need to install body-parser as well as express from npm.

```
$ npm install express body-parser
```

Let's create a basic express application, so replace the contents of `index.js` with:

```javascript
const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.listen(3000)
```

This will create an express application, using the json parser from bodyParser, and it's going to listen on port 3000, because that's what we told ngrok we're going to use.

### Create webhooks for the answer and event url

Now it's time we created the webhook routes for the URLs we gave nexmo. So create a get handler for `/webhooks/answer`, and return an NCCO in JSON format. We'll use the same NCCO we created for making a call, with the same talk action and the same voice, speaking the same text.

For the event URL, we're going to create a post handler for `/webhooks/events`, and we'll just log the request body to the console. Because Nexmo has a retry mechanism, it's going to keep resending the event if the URL doesn't respond with 200OK, so we'll send back a 200 status.

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

We've got the application created, and Nexmo knows to interact with it for the voice application. But for now, Nexmo doesn't have an association between the phone number you bought and the application you created, so we're going to need to link those two together. We'll use the command line to do it.

When there is a call on a Nexmo phone number, Nexmo is going to look for the application linked to it, and then use the answer and event URLs attached to the application.

```
$ nexmo link:app YOUR_NEXMO_NUMBER YOUR_APPLICATION_ID
```

### Run the application

The application isn't running yet, so we'll need to run the index file we created. After that's running, go ahead and call your Nexmo phone number. You should get a phone call with the text, and see the events as they are happening in the terminal window.

```
$ node index.js
```
