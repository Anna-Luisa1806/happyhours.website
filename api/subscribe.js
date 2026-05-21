export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, type, company, category, phone } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }

  const API_KEY = process.env.EMAILOCTOPUS_API_KEY;
  const LIST_ID = process.env.EMAILOCTOPUS_LIST_ID;

  const tags = type === 'anbieter' ? ['Anbieter'] : ['Teilnehmer'];

  const fields = { FirstName: firstName || '' };
  if (type === 'anbieter') {
    if (company)  fields['Company']  = company;
    if (category) fields['Category'] = category;
    if (phone)    fields['Phone']    = phone;
  }

  try {
    const response = await fetch(
      `https://emailoctopus.com/api/1.6/lists/${LIST_ID}/contacts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:       API_KEY,
          email_address: email,
          fields,
          tags,
          status: 'SUBSCRIBED',
        }),
      }
    );

    const data = await response.json();

    if (response.ok || data?.error?.code === 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
      return res.status(200).json({ success: true });
    }

    return res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' });

  } catch (err) {
    return res.status(500).json({ error: 'Verbindungsfehler. Bitte versuche es erneut.' });
  }
}
