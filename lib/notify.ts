type NotifyPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function notifyAdmin({ title, body, url }: NotifyPayload) {
  const webhookUrl = process.env.ADMIN_NOTIFY_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${title}\n${body}${url ? `\n${url}` : ''}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${title}*\n${body}`,
            },
          },
          ...(url
            ? [{
                type: 'actions',
                elements: [{
                  type: 'button',
                  text: { type: 'plain_text', text: '관리자에서 보기' },
                  url,
                }],
              }]
            : []),
        ],
      }),
    });
  } catch (error) {
    console.error('ADMIN_NOTIFY_ERROR:', error);
  }
}
