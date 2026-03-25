require('dotenv').config({ path: require('path').join(__dirname,'../.env') });
const { google } = require('googleapis');
const http = require('http'), url = require('url');
const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'http://localhost:4000/auth/google/callback');
const authUrl = client.generateAuthUrl({ access_type:'offline', scope:['https://www.googleapis.com/auth/calendar'], prompt:'consent' });
console.log('\n🔑 Open this URL:\n\n' + authUrl + '\n');
const server = http.createServer(async (req,res) => {
  const { code } = url.parse(req.url,true).query;
  if (!code) return;
  try {
    const { tokens } = await client.getToken(code);
    res.writeHead(200,{'Content-Type':'text/html'});
    res.end(`<body style="font-family:monospace;background:#0d1117;color:#7ee787;padding:40px"><h2>✅ Done!</h2><pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre></body>`);
    console.log('\n✅ Add to backend/.env:');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    server.close(() => process.exit(0));
  } catch(e){ res.writeHead(500); res.end(e.message); }
});
server.listen(4000, () => console.log('Waiting on http://localhost:4000/auth/google/callback...'));
