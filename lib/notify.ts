type NotifyPayload = {
  title: string;
  body: string;
  url?: string;
};

function buildText({ title, body, url }: NotifyPayload) {
  return [`[아이엠농부] ${title}`, body, url].filter(Boolean).join('\n');
}

export async function notifyAdmin(payload: NotifyPayload) {
  const provider = (process.env.ADMIN_NOTIFY_PROVIDER || 'slack').toLowerCase();
  const webhookUrl = process.env.ADMIN_NOTIFY_WEBHOOK_URL;
  const text = buildText(payload);

  try {
    if (provider === 'discord' && webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          username: '아이엠농부 알림',
          allowed_mentions: { parse: [] },
        }),
      });
      return;
    }

    if (provider === 'telegram') {
      const token = process.env.ADMIN_NOTIFY_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.ADMIN_NOTIFY_TELEGRAM_CHAT_ID;
      if (!token || !chatId) return;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return;
    }

    if (provider === 'ntfy') {
      const topic = process.env.ADMIN_NOTIFY_NTFY_TOPIC;
      const baseUrl = process.env.ADMIN_NOTIFY_NTFY_BASE_URL || 'https://ntfy.sh';
      if (!topic) return;

      await fetch(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers: {
          Title: payload.title,
          Tags: 'shopping_cart',
          Priority: 'default',
        },
        body: text,
      });
      return;
    }

    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${payload.title}*\n${payload.body}`,
            },
          },
          ...(payload.url
            ? [{
                type: 'actions',
                elements: [{
                  type: 'button',
                  text: { type: 'plain_text', text: '관리자에서 보기' },
                  url: payload.url,
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
