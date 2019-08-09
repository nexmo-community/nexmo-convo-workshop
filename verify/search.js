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
