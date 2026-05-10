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
        title,
        body,
        url,
      }),
    });
  } catch (error) {
    console.error('ADMIN_NOTIFY_ERROR:', error);
  }
}
