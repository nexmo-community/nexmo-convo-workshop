// const Nexmo = require('nexmo')
//
// const nexmo = new Nexmo({
//   apiKey: NEXMO_API_KEY,
//   apiSecret: NEXMO_API_SECRET,
//   applicationId: NEXMO_APPLICATION_ID,
//   privateKey: NEXMO_APPLICATION_PRIVATE_KEY_PATH
// })
//
// nexmo.calls.create({
//   to: [{
//     type: 'phone',
//     number: TO_NUMBER
//   }],
//   from: {
//     type: 'phone',
//     number: NEXMO_NUMBER
//   },
//   ncco: [{
//     action: "talk",
//     voiceName: "Nicole",
//     text: "What do you get if you cross a telephone with an iron? A smooth operator!"
//   }]
// })

const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.listen(3000)

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
