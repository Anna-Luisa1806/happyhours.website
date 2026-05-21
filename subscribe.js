export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, type, company, category, phone } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }

  const API_KEY   = process.env.EMAILOCTOPUS_API_KEY;
  const LIST_ID   = process.env.EMAILOCTOPUS_LIST_ID;

  // Build tags based on type
  const tags = type === 'anbieter'
    ? ['Anbieter']
    : ['Teilnehmer'];

  // Build fields
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
          status: 'PENDING',
        }),
      }
    );

    const data = await response.json();

    // Already subscribed is fine – treat as success
    if (response.ok || data?.error?.code === 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
      return res.status(200).json({ success: true });
    }

    console.error('EmailOctopus error:', data);
    return res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' });

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Verbindungsfehler. Bitte versuche es erneut.' });
  }
}
