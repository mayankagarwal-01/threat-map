// Please install OpenAI SDK first: `npm install openai`

const {OpenAI} = require('openai');

async function main(API,email) {

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: API
});


const prompt = `
  Given the following email content, extract the following fields in JSON & RESPOND ONLY FINAL ANSWER:
  - Threat Campaign (campaign)
  - Type of Threat (High, Medium, Low, Urgent) adjust for nuance (type)
  - Suspected IPs of Threat (suspect_ip) 
  - Summary (summary)
  the JSON format should be :
  - campaign
  - type
  - suspect_ip (string format only with port no., if non-existent 'Not Available')
  - summary
  Email:
  ${email}
  `;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "deepseek-chat",
  });
  const data = completion.choices[0].message.content;
  const jsonString = data.replace(/```json|```/g, '').trim();

  return JSON.parse(jsonString);
}

module.exports = { main };

