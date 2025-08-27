import { App, LogLevel } from '@slack/bolt';
import axios from 'axios';
require('dotenv').config();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  token: process.env.SLACK_BOT_TOKEN!,
  logLevel: LogLevel.INFO,
});

// ApexFlow slash command
app.command('/ApexFlow', async ({ ack, say, command }) => {
  await ack();
  
  const helpMessage = `👋 Hi <@${command.user_id}>! Welcome to ApexFlow.

*Available commands:*
• \`search <query>\` - Search through your documents
• \`upload\` - Get upload instructions
• \`status\` - Check processing status
• Or just mention me in a thread with your question!

*Examples:*
• \`search quarterly report 2024\`
• \`upload\`
• \`@ApexFlow what does the contract say about payment terms?\``;

  await say({
    text: helpMessage,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: helpMessage,
        },
      },
    ],
  });
});

// Handle app mentions
app.event('app_mention', async ({ event, client, say }) => {
  try {
    const messageText = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    if (!messageText) {
      await say({
        thread_ts: event.ts,
        text: '👋 Hi there! Ask me a question about your documents or use `/ApexFlow` for help.',
      });
      return;
    }

    // Post initial "working on it" message
    const workingMessage = await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '🔍 Working on it...',
    });

    try {
      // Call agent orchestrator for RAG query
      const agentUrl = process.env.AGENT_ORCHESTRATOR_URL || 'http://localhost:3002';
      const response = await axios.post(`${agentUrl}/qa`, {
        query: messageText,
        context: {
          userId: event.user,
          channel: event.channel,
          timestamp: event.ts,
        },
      }, {
        timeout: 30000,
      });

      const { answer, citations, confidence } = response.data;

      // Format citations
      let citationsText = '';
      if (citations && citations.length > 0) {
        citationsText = '\n\n*Sources:*\n' + citations.map((citation: any, index: number) => 
          `${index + 1}. ${citation.title} (${citation.documentId})`
        ).join('\n');
      }

      const confidenceEmoji = confidence > 0.8 ? '🎯' : confidence > 0.6 ? '👍' : '🤔';

      // Update the working message with the result
      await client.chat.update({
        channel: event.channel,
        ts: workingMessage.ts!,
        text: `${confidenceEmoji} ${answer}${citationsText}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${confidenceEmoji} ${answer}${citationsText}`,
            },
          },
        ],
      });

    } catch (error) {
      console.error('Agent orchestrator error:', error);
      
      // Update working message with error
      await client.chat.update({
        channel: event.channel,
        ts: workingMessage.ts!,
        text: '❌ Sorry, I encountered an error processing your request. Please try again later.',
      });
    }

  } catch (error) {
    console.error('App mention error:', error);
    
    await say({
      thread_ts: event.ts,
      text: '❌ Something went wrong. Please try again.',
    });
  }
});

// Handle message shortcuts or other interactions
app.shortcut('search_documents', async ({ ack, body, client }) => {
  await ack();
  
  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'search_modal',
        title: {
          type: 'plain_text',
          text: 'Search Documents',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'search_input',
            element: {
              type: 'plain_text_input',
              action_id: 'search_query',
              placeholder: {
                type: 'plain_text',
                text: 'Enter your search query...',
              },
              multiline: false,
            },
            label: {
              type: 'plain_text',
              text: 'Search Query',
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Search',
        },
      },
    });
  } catch (error) {
    console.error('Search shortcut error:', error);
  }
});

// Error handling
app.error(async (error) => {
  console.error('Slack app error:', error);
});

// Start the app
(async () => {
  try {
    const port = process.env.SLACK_BOT_PORT ? Number(process.env.SLACK_BOT_PORT) : 3001;
    await app.start(port);
    
    console.log('⚡️ ApexFlow Slack bot is running on port', port);
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down Slack bot gracefully');
      await app.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start Slack bot:', error);
    process.exit(1);
  }
})();
