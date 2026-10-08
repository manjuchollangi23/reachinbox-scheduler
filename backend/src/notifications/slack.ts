import axios from 'axios';

export const sendSlackNotification = async (slackToken: string, message: string) => {
  try {
    if (!slackToken) return;

    // For a real Slack OAuth, the token might be a webhook URL or a Bot token.
    // Assuming the slackToken stored is an incoming webhook URL for simplicity in this demo,
    // as it's the easiest to test.
    // If it's a Bot token, we'd use the chat.postMessage API.
    
    // Check if it's a webhook URL
    if (slackToken.startsWith('http')) {
      await axios.post(slackToken, {
        text: message
      });
    } else {
      // Assuming Bot Token
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel: '#general', // or dynamically determine channel
        text: message
      }, {
        headers: {
          'Authorization': `Bearer ${slackToken}`,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Slack notification sent successfully.');
  } catch (error: any) {
    console.error('Failed to send Slack notification:', error?.response?.data || error.message);
  }
};
