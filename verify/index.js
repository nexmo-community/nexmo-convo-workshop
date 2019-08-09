const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: "NEXMO_API_KEY",
  apiSecret: "NEXMO_API_SECRET"
});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

var verifyRequestId;

nexmo.verify.request({
  number: RECIPIENT_NUMBER,
  brand: "NEXMO_BRAND_NAME"
}, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    verifyRequestId = result.request_id;
    console.log("Verification in progress:", verifyRequestId);
  }
});

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
});
