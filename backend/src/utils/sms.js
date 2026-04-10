const axios = require('axios');

async function sendSMS(number, message) {
  const token = process.env.TEXT_LK_TOKEN;
  const senderId = process.env.TEXT_LK_SENDER_ID || 'TextLKDemo';

  if (!token || token === 'your_api_token_here') {
    console.warn('SMS token not set. Skipping SMS send.');
    return { success: false, error: 'Token not configured' };
  }

  // Format number: Ensure 94 prefix if starts with 0
  let formattedNumber = number;
  if (number.startsWith('0')) {
    formattedNumber = '94' + number.slice(1);
  } else if (!number.startsWith('94')) {
    formattedNumber = '94' + number;
  }

  try {
    const url = `https://app.text.lk/api/v3/sms/send`;
    
    // v3 uses POST with Bearer token
    const response = await axios.post(url, {
      recipient: formattedNumber,
      sender_id: senderId,
      message: message,
      type: 'plain'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`[text.lk] SMS result for ${formattedNumber}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('[text.lk] SMS Send Error:', errorData);
    return { success: false, error: errorData };
  }
}

module.exports = { sendSMS };
