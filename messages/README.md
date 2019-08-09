# Send and receive messages with the Nexmo APIs

## Send an SMS message

### Install node dependencies

    $ npm init
    $ npm install nexmo

### Initialize dependencies

Create an `index.js` file:

    $ touch index.js

Initialize the Nexmo node library in the `index.js` file you created:

```javascript
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET
})
```

### Send SMS message with the SMS API

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

### Send SMS message with the new Messages API

First, you'll need to update the version of the Nexmo library we've been using. We'll install the beta version for this APIs

    $ npm install nexmo@beta

#### Create a Messages Application

    $ nexmo app:create "A Messages Application" YOUR_NGROK_URL/webhooks/inbound-message YOUR_NGROK_URL/webhooks/message-status --keyfile=private.key --type=messages

#### Initialize dependencies

```javascript
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET,
  applicationId: NEXMO_APPLICATION_ID,
  privateKey: NEXMO_APPLICATION_PRIVATE_KEY_PATH
})
```

#### Send the same SMS message

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

## Receive SMS messages

### Create a web server

Create an express application

    $ npm install express body-parser

Replace the contents of `index.js` with:

```javascript
const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(3000)
```

### Create webhook for the inbound url

```javascript
app.post('/webhooks/inbound-message', (req, res) => {
  console.log(req.body);

  res.status(200).end();
});
```

### Autoresponder

If you combine the two together in the inbound webhook, you have a SMS autoresponder.

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

### Understanding Facebook messaging

Only individuals may create a Facebook Profile. However, an individual can use their Profile to create a Facebook Page for a business.

A Facebook user must initiate communication using Facebook Messenger via the business's Facebook Page. A message from the business to the Facebook user will otherwise be refused.

Facebook Messenger uses its own form of IDs for the Facebook User and the Facebook Page :

-   Facebook User (profile) - Page-Scoped ID (PSID)
-   Facebook Page (business) - Page ID

The Facebook User will have a Page-scoped ID (PSID) and this is unique for each Facebook Profile. The business can only obtain the PSID of a user when the user sends a message to the business. In Facebook Messenger, the default is for the customer to initiate a conversation with a business.

In order to get started with Facebook Messenger you will need to link your business's Facebook Page to Nexmo.

> **NOTE:** The link between your Nexmo account and Facebook page expires after 90 days. After then you must re-link it.

### Link your Facebook Page to your Nexmo account

Linking your Facebook page to your Nexmo account allows Nexmo to handle inbound messages and enables you to send messages from the Nexmo Messages API.

> **IMPORTANT:** This process needs to be authenticated by JWT. The JWT generated in this case can be based on any Application ID in your account, as this JWT is only used to authenticate the linking process, and it not used to authenticate application-specific API calls.

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

**7.** Select the Facebook Page you want to connect to your Nexmo account from the drop down list.

**8.** Paste your JWT into the box labeled "2. Provide a valid JWT token".

**9.** You will receive a message confirm successful subscription.

At this point your Nexmo Account and this Facebook Page are linked.

> **NOTE:** If at some point in the future you want to further link a specific application to this Facebook Page you can now do this from the Dashboard on the External Accounts tab for the specific Messages and Dispatch application you want to link.

### Update your Autoresponder to use Messenger instead of SMS

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
