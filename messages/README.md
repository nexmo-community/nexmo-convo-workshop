# Send and receive messages with the Nexmo APIs

If you want to send or receive text messages Nexmo has a few APIs that deal with that. We'll focus here on SMS and Facebook Messanger, but if you want to hear more about Viber or Whatsapp, talk to an account manager.

We'll send SMS messages with two different APIs and we'll receive them as well. We'll be using the Messages API to send a message via Facebook Messenger and then we'll use the Dispatch API to try sending a Facebook message, and if that fails to be read in 15 seconds, we'll failover to sending an SMS message instead.

## Send an SMS message with the SMS API

The SMS API is the first Nexmo API, and we'll use it to send an SMS to your phone number.

### Install node dependencies

First off, initialize a NPM package, otherwise, older versions of NPM will complain about installing a package without having a package.json first. Just use the defaults for init, and then install the Nexmo Node.js package.

```
$ npm init
$ npm install nexmo
```
### Initialize dependencies
v
We'll create a new JavaScript file, let's call it `index.js`.

```
$ touch index.js
```

We need to initialize the Nexmo node library we installed earlier, in the `index.js` file you created:

```javascript
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET
})
```

Replace the values in there with your actual API key and secret.

### Send the SMS message

The Nexmo library has a method for sending the SMS with the SMS API, and that's `nexmo.message.sendSms`. The method takes as parameters 3 strings, the Nexmo number from which to send the SMS, the phone number where to deliver the SMS and the text of the message. It also accepts a callback that gets called when the API request is done. The response data contains an array for all the messages that were sent, with information about their status. In most cases, it's going to be 1 element in that array, but if the SMS was longer than 160 characters, it gets split into a multipart SMS, and then the array contains data about each part sent. If the status of the message is 0, the SMS was sent successfully, otherwise, the error data for the message is on the `error-text` property of the message.

```javascript
let text = "Hello from Nexmo";
nexmo.message.sendSms(FROM, TO, text, (err, responseData) => {
  if (err) {
    console.log(err);
  } else {
    if (responseData.messages[0]['status'] === "0") {
      console.log("Message sent successfully.");
    } else {
      console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
    }
  }
})
```

If your carrier network supports alphanumeric sender IDs, `FROM` can be text instead of a phone number, otherwise it has to be a phone number. Depending on the country you're trying to send the SMS to, there are regulations that require you to own the phone number you're sending the SMS from, so you'll have to use the Nexmo number you bought earlier today.

## Send an SMS message with the new Messages API

There is another API that deals with sending text messages from Nexmo called the Messages API. It is multi-channel API,  that can send a message via different channels, for example, SMS, Facebook Messenger, Viber, and Whatsapp. The API is in Beta right now, so if we want to use it to send the same SMS message, we'll need to install the beta version of the Nexmo node library.

```
$ npm install nexmo@beta
```

### Create a Messages Application

To interact with the Messages API, we'll need to create a messages application on the Nexmo platform to authenticate our requests. Think of applications more like containers, metadata to group all your data on the Nexmo platform. We'll create one using the CLI, and that needs a name, and inbound URL and a status URL. We'll also save a keyfile on disk. Applications work on a public / private key system, so when you create an application, a public key is generated and kept with Nexmo, and a private key is generated, not kept with Nexmo, and returned to you via the creation call. We'll use the private key to authenticate our library calls later on.

Use the ngrok URL you got in the previous voice workshop and fill in the command before running it. When a message is coming to the Messages API, the data about the message is sent to the inbound URL. When you send a message with the API, the data about the message status gets sent to the status URL.

```
$ nexmo app:create "A Messages Application" YOUR_NGROK_URL/webhooks/inbound-message YOUR_NGROK_URL/webhooks/message-status --keyfile=private.key --type=messages
```


#### Initialize dependencies

Let's replace the contents of the file we created earlier. We need to initialize the Nexmo node library we installed earlier, in the `index.js` file you created:


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


### Send the same SMS message

In order to send an SMS message with the Messages API, we'll use the `nexmo.channel.send` method from the beta version of the Nexmo node library. The method accepts objects as parameters, with information about the recipient, sender, and content. They vary for the different channels, you'll need to check the  API documentation for the other channels mentioned. For SMS, the type of recipient and sender is `sms`, and the object has to contain a  number property as well. The content object accepts a type of text and a text message. The callback returns a data object, and we'll log the message UUID to the console.

```javascript
nexmo.channel.send(
  { "type": "sms", "number": "TO_NUMBER" },
  { "type": "sms", "number": "FROM_NUMBER" },
  {
    "content": {
      "type": "text",
      "text": "Hello from Nexmo"
    }
  },
  (err, data) => { console.log(data.message_uuid); }
);
```

And that's it, you've sent the same SMS message using two different Nexmo APIs. You'll notice the Messages API is a lot more verbose in usage, while both API need just one method to accomplish the same thing.

## Receive SMS messages

When a Nexmo phone number receives an SMS message, Nexmo will pass that message to a Webhook you have specified in the Nexmo dashboard. In order to set up the webhook URL, got to the [Settings](https://dashboard.nexmo.com/settings) section of the dashboard and fill in the "Inbound messages" field with `YOUR_NGROK_URL/webhooks/inbound-message`. Don't forget to replace your actual ngrok URL.

### Create a web server

We'll be creating our webserver using express because it's one of the most popular and easy to use node frameworks for this purpose. We'll also be looking at the request bodies for the inbound URL, so we'll need to install body-parser as well as express from npm.

```
$ npm install express body-parser
```

We'll create a basic express application, that uses the JSON parser from `bodyParser` and sets the `urlencoded` option to `true`. We'll use the same port 3000 for the server to listen to, we already have ngrok running on port 3000.

```javascript
const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(3000)
```

### Create webhook for the inbound url

For the inbound URL, we're going to create a post handler for `/webhooks/inbound-message`, and we'll just log the request body to the console. Because Nexmo has a retry mechanism, it's going to keep resending the message if the URL doesn't respond with 200OK, so we'll send back a 200 status.

```javascript
app.post('/webhooks/inbound-message', (req, res) => {
  console.log(req.body);

  res.status(200).end();
});
```

### Autoresponder

One of the most common use cases for sending and receiving SMS messages is an autoresponder. So if you combine the two together parts together in the inbound webhook, you have an SMS autoresponder, that replies with and SMS to all the incoming SMS messages.

```javascript
app.post('/webhooks/inbound-message', (req, res) => {
  console.log(req.body);

  nexmo.channel.send(
    { "type": "sms", "number": req.body.msisdn },
    { "type": "sms", "number": req.body.to },
    {
      "content": {
        "type": "text",
        "text": "Hello from Nexmo"
      }
    },
    (err, data) => { console.log(data.message_uuid); }
  );

  res.status(200).end();
});
```

## Send a Facebook Messenger message

The Messages API has more channels than SMS, so we'll use it to send the same message on Facebook Messenger. Before we do that, we'll need to understand how Facebook messaging works and create a Facebook page. After we have the Facebook page, we'll need to link that as an external account on the Nexmo platform.

### Understanding Facebook messaging

Only individuals may create a Facebook Profile. However, an individual can use their Profile to create a Facebook Page for a business.

A Facebook user must initiate communication using Facebook Messenger via the business's Facebook Page. A message from the business to the Facebook user will otherwise be refused.

Facebook Messenger uses its own form of IDs for the Facebook User and the Facebook Page :

-   Facebook User (profile) - Page-Scoped ID (PSID)
-   Facebook Page (business) - Page ID

The Facebook User will have a Page-scoped ID (PSID) and this is unique for each Facebook Profile. The business can only obtain the PSID of a user when the user sends a message to the business. In Facebook Messenger, the default is for the customer to initiate a conversation with a business.

In order to get started with Facebook Messenger, you will need to link your business's Facebook Page to Nexmo.

> **NOTE:** The link between your Nexmo account and Facebook page expires after 90 days. After then you must re-link it.

### Link your Facebook Page to your Nexmo account

Linking your Facebook page to your Nexmo account allows Nexmo to handle inbound messages and enables you to send messages from the Nexmo Messages API.

> **IMPORTANT:** This process needs to be authenticated by JWT. The JWT generated, in this case, can be based on any Application ID in your account, as this JWT is only used to authenticate the linking process, and it not used to authenticate application-specific API calls.

You will need to paste in a valid JWT. If you don't have one you can create one as follows:

**1.** Create a temporary application:

```shell
nexmo app:create "Delete Me Later" https://example.com/inbound https://example.com/status --keyfile=temp.key --type=messages
```

**2.** Copy the generated Application ID to the clipboard.

**3.** Generate a JWT with the following command, pasting in your Application ID:

```shell
JWT="$(nexmo jwt:generate ./temp.key application_id=YOUR_APP_ID)"
```

> **TIP:** This JWT will expire after the default 15 minutes.

**4.** Display the generated JWT:

```shell
echo $JWT
```

**5.** Copy the JWT to the clipboard.

You are now ready to link your Facebook Page to Nexmo:

**6.** Click the following link when you have your JWT pasted to the clipboard and you are ready to link your Facebook Page to Nexmo:

-   [Link your Facebook Page to Nexmo](https://static.nexmo.com/messenger/)

You will see your Facebook Pages listed.

**7.** Select the Facebook Page you want to connect to your Nexmo account from the drop-down list.

**8.** Paste your JWT into the box labeled "2. Provide a valid JWT token".

**9.** You will receive a message confirming successful subscription.

At this point, your Nexmo Account and this Facebook Page are linked.

> **NOTE:** If at some point in the future you want to further link a specific application to this Facebook Page you can now do this from the Dashboard on the External Accounts tab for the specific Messages and Dispatch application you want to link.

### Update your Autoresponder to use Messenger instead of SMS

Because Facebook's policy only allows you to reply to an incoming message, the autoresponder use case works great for this. We've already built one, and switching the code from SMS to Facebook only requires you to change the recipient and sender objects in the `nexmo.channel.send` method. The type will change to `messenger` and the objects don't require a number anymore but require facebook IDs for the recipient user and the sender page. The content object stays the same, but you can have multiple content types for Facebook, for sending images and files for example.

```javascript
app.post('/webhooks/inbound-message', (req, res) => {
  console.log(req.body);

  nexmo.channel.send(
    { "type": "messenger", "id": req.body.from.id },
    { "type": "messenger", "id": req.body.to.id },
    {
      "content": {
        "type": "text",
        "text": "Hello from Nexmo"
      }
    },
    (err, data) => { console.log(data.message_uuid); }
  );

  res.status(200).end();
});
```

## Add fallback to SMS

We've successfully switched our Autoresponder from SMS to Facebook, but what happens when we want resilience into our code, maybe use the other when one fails. Nexmo has the Dispatch API built just for that purpose.

We'll update our Autoresponder to use the `nexmo.dispatch.create` method instead of `nexmo.channel.send` method. The method is a bit more complex, accepting a template for the first parameter, in our case `failover`. The next parameter is an array of objects, where each object is a different channel, all but the last having a failover property that sets the expiry time and the condition to be met. The first object is a Facebook message. with a 15 seconds failover time, the minimum, and the read condition status of the message. The second channel is SMS.

The method accepts a callback, and we're using it to log the dispatch UUID from the response.

```javascript
app.post('/webhooks/inbound-message', (req, res) => {
  console.log(req.body);

  nexmo.dispatch.create("failover", [{
      "from": { "type": "messenger", "id": req.body.to.id },
      "to": { "type": "messenger", "id": req.body.from.id },
      "message": {
        "content": {
          "type": "text",
          "text": "Hello from Nexmo"
        }
      },
      "failover": {
        "expiry_time": 15,
        "condition_status": "read"
      }
    }, {
      "from": { "type": "sms", "number": "Nexmo" },
      "to": { "type": "sms", "number": "447491738558" },
      "message": {
        "content": {
          "type": "text",
          "text": "This is an SMS sent from the Dispatch API"
        }
      }
    }],
    (err, data) => {
      console.log(data.dispatch_uuid);
    }
  );

  res.status(200).end();
});
```
