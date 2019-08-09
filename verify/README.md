# Verify a phone number with the Nexmo Verify API

## Initiate a verification

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
  apiSecret: NEXMO_API_SECRET
})
```

### Send verification code

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

## Check verification code

First, add an utility so you can input your verification code in the terminal window

```javascript
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
```

Then add the code that asks you for a code and then checks it with the Nexmo API

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

```
$ node index.js
```

## [Optional] Control Verification request

We'll create separate files for these, and call them from the terminal, passing the request id after running them

### Triger next event

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

### Cancel request

Duplicate the same file, while replacing the `trigger_next_event` command with `cancel`

### Search request

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
