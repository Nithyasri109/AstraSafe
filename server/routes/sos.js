const express = require('express');
const router = express.Router();
const twilio = require('twilio');

router.post('/alert', async (req, res) => {
  try {
    const { contacts, locationUrl } = req.body;
    
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ msg: 'No contacts provided' });
    }

    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

    if (TWILIO_SID && TWILIO_AUTH && TWILIO_PHONE) {
      const client = twilio(TWILIO_SID, TWILIO_AUTH);
      
      // Dispatch SMS
      for (let contact of contacts) {
        if (contact.phone) {
          try {
            await client.messages.create({
              body: `EMERGENCY! I need help immediately. My location is: ${locationUrl}`,
              from: TWILIO_PHONE,
              to: contact.phone
            });
            console.log(`Sent SMS to ${contact.phone}`);

            // Dispatch Call (Voice)
            await client.calls.create({
              twiml: `<Response><Say>Emergency! The user is in distress. Please check your SMS for their live location.</Say></Response>`,
              to: contact.phone,
              from: TWILIO_PHONE
            });
            console.log(`Dispatched Call to ${contact.phone}`);

          } catch (err) {
            console.error(`Twilio Error dispatching to ${contact.phone}:`, err.message);
          }
        }
      }
      return res.json({ msg: 'Automatic SMS and Calls dispatched via Twilio' });
    } else {
      console.log('--- TWILIO MOCK DISPATCH ---');
      contacts.forEach(c => {
        console.log(`[Twilio Mock] Sending SMS to ${c.phone}: Emergency! Location: ${locationUrl}`);
        console.log(`[Twilio Mock] Initiating Auto-Call to ${c.phone}`);
      });
      return res.json({ msg: 'Automatic SMS and Calls simulated (Provide Twilio credentials in .env to send real ones)' });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
