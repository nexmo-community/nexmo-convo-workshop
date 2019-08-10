# Verify a phone number with the Nexmo Verify API

The Nexmo Verify API enables you to confirm that you can contact a user at a specific number. The way it works is you send a phone number to Nexmo to verify, and Nexmo sends back a request id. Nexmo then tries to send an SMS message with a generated PIN number, and if the user isn't verified in a certain time frame, it calls them and plays the same code via text to speech.

When the user supplies a PIN to you, you can check with the Verify API wether that's the correct PIN or not. And that's the basis of the Verify API. If we have time, we'll go deeper into some other options you have, like check the status of a verification request, trigger the next event in the process or cancel the request altogether.

## Initiate a verification

We're going to initiate a verification using a Node.js application and the Nexmo node library, and we'll add a command line interface to supply the PIN number while running the application.

### Install node dependencies

First off, initialize a NPM package, otherwise, older versions of NPM will complain about installing a package without having a package.json first. Just use the defaults for init, and then install the nexmo Node.js package.


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
  apiSecret: NEXMO_API_SECRET
})
```

Replace the values in there with your actual API key and secret.


### Send verification code

We're going to start the verification process. There is the `nexmo.verify.request` method in the Nexmo library that accepts an object with a number to be verified and a brand message to display to the user, that gets appended at the beginning of the SMS or TTS. For example if we use brand `Workshop`, the message you receive is going to say `Workshop code: 1234. Valid for 5 minutes.`. The method also accepts a callback function, that will get called after the API call is done. The method is called with `(error. null)` in case there is an error, or with `(null, result)` when the API call was successful. The result contains information about your verification request, most importantly the request id. We'll log that to the console.

```javascript
var verifyRequestId;

nexmo.verify.request({
  number: RECIPIENT_NUMBER,
  brand: NEXMO_BRAND_NAME
}, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    verifyRequestId = result.request_id;
    console.log("Verification in progress:", verifyRequestId);
  }
});
```

Don't forget to replace the values in there with your phone number and a brand message.

## Check verification code

Usually after you've sent a verification request you already have a handy interface for the user to introduce the code they received, but for the purpose of keeping this workshop brief, we won't go into building unnecessary UI. Let's just add an utility called `readline` from node that lets you read values from the command line. The `readline` usage is not really standard, we'll need to call `createInterface` after requiring the package, and tell it to use standard input and output.

```javascript
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
```

To check a Verify request we'll use another method from the Nexmo node library, `nexmo.verify.check`, that takes an object as parameter with the request id you're trying to verify and the code supplied. The callbacks work the same accross the library, so we'll add a boilerplate method that displays the error or result to the console. The check code is encapsulated here in  a `readline.question` method, that outputs a question to the command line, and then passes the `code` to our nexmo method.

```javascript
readline.question("What's your verification code? ", (code) => {

  nexmo.verify.check({
    request_id: verifyRequestId,
    code: code
  }, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });

  readline.close()
})
```

## Run the application

Now that we've created our application, the only thing needed to verify the phone number is running the code. Go ahead and run it with node, and you should be getting a SMS message from `verify` if your network provider supports alphanumeric senders, or from a random Nexmo number if it doesn't.

```
$ node index.js
```

## [Optional] Control Verification request

We were talking at the beginning of this slot about other things you can do with the Verify API. One of those is to trigger the next event in the verification process, for example the text to speech phone call. By default Nexmo will send an SMS message, then a text to speech phone call, and if that fails, another text to speech phone call.  If you want to define your own workflow or specify your own PIN code, you can do so, but you'll need to speak to an account manager.

### Triger next event

If we want to trigger the next event in the workflow, we'll use the `nexmo.verify.control` method in the Node library. That takes an object as parameter, with the request id and a command, in this case the `trigger_next_event` command.

I've created a separate file for this case, so we can run them without starting another verification process. The previous application outputs the request id in the terminal, so we'll copy that and paste it into the `readline` input for this file. Let's call it `next.js`.

Because it's a new file, I'll also need to initialize the Nexmo library again, and `readline`, just as above. I've wrapped the `control` method in the same way as I did for the `check` method earlier, inside a readline question, this time accepting a `requestId`.

```javascript
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: "NEXMO_API_KEY",
  apiSecret: "NEXMO_API_SECRET"
});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question("What's your request ID? ", (requestId) => {

  nexmo.verify.control({
    request_id: requestId,
    cmd: 'trigger_next_event'
  }, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });

  readline.close()
});
```

Before running the code, don't forget to replace the values with your Nexmo API key and secret.

```
$ node next.js
```

### Cancel request

If you want to cancel a request instead of triggering the next event, the code is extremely similar, almost identical. The only difference is, inside the `nexmo.verify.control` method, the object has a command of `cancel` instead of `trigger_next_event`. Some verification processes may be too advanced to cancel though, for example if the SMS message and both text to speech calls already happened.

### Search request

If you want to see the status of a verification request, the Nexmo node library has a method for it, `nexmo.verify.search`, that accepts a string parameter, the request id. I've wrapped this code in the same way we did for triggering the next event or canceling a verification request. The callback will give you all the details on the result parameter if the verification is ongoing, or it will send an error if the verification was completed and is not ongoing.

```javascript
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: "NEXMO_API_KEY",
  apiSecret: "NEXMO_API_SECRET"
});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question("What's your request ID? ", (requestId) => {

  nexmo.verify.search(requestId, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });

  readline.close()
});
```
