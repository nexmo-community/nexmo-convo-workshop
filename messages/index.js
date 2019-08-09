// const Nexmo = require('nexmo');
// const nexmo = new Nexmo({
//   apiKey: "NEXMO_API_KEY",
//   apiSecret: "NEXMO_API_SECRET"
// });
//
// var text = "Hello from Nexmo";
//
// nexmo.message.sendSms("Nexmo", "TO", text, {
//   type: "unicode"
// }, (err, responseData) => {
//   if (err) {
//     console.log(err);
//   } else {
//     if (responseData.messages[0]['status'] === "0") {
//       console.log("Message sent successfully.");
//     } else {
//       console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
//     }
//   }
// })


const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET,
  applicationId: NEXMO_APPLICATION_ID,
  privateKey: NEXMO_APPLICATION_PRIVATE_KEY_PATH
})

const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.listen(3000)

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
      "from": { "type": "sms", "number": "NEXMO_NUMBER" },
      "to": { "type": "sms", "number": "TO_NUMBER" },
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
