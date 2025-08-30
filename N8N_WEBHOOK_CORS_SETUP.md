# N8N Webhook CORS Configuration Guide

## Problem
Your N8N webhook at `https://n8n.lakestrom.com/webhook/get_cvjd` needs to accept requests from your GitHub Pages site at `https://pangeafate.github.io`.

## Solution: Configure CORS in N8N Workflow

### Method 1: Add Response Headers in Webhook Node

1. **Open your N8N instance**
   - Navigate to https://n8n.lakestrom.com
   - Open the workflow containing your `get_cvjd` webhook

2. **Edit the Webhook Node**
   - Click on the Webhook node to open settings
   - Look for "Response Mode" or "Options"
   - Set Response Mode to "When Last Node Finishes"

3. **Add a Set Node after your webhook**
   - Add a new "Set" node after your webhook
   - Configure it to set response headers:
   ```json
   {
     "Access-Control-Allow-Origin": "https://pangeafate.github.io",
     "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type, Accept",
     "Access-Control-Max-Age": "86400"
   }
   ```

### Method 2: Use HTTP Response Node

1. **Add an HTTP Response Node**
   - At the end of your workflow, add an "HTTP Response" node
   - This gives you full control over the response

2. **Configure the HTTP Response Node**
   ```javascript
   // In the HTTP Response node settings:
   Response Code: 200
   Response Headers:
   {
     "Access-Control-Allow-Origin": "https://pangeafate.github.io",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type",
     "Content-Type": "application/json"
   }
   ```

3. **Handle OPTIONS Preflight Requests**
   - Add an IF node after your webhook
   - Check if method === 'OPTIONS'
   - If OPTIONS, return immediately with CORS headers
   - If POST, continue with normal processing

### Method 3: Configure N8N Instance-Wide CORS

If you have admin access to the N8N instance:

1. **Edit N8N Environment Variables**
   ```bash
   # In your N8N configuration
   N8N_CORS_ORIGIN=https://pangeafate.github.io
   N8N_CORS_ALLOW_METHODS=POST,GET,OPTIONS
   N8N_CORS_ALLOW_HEADERS=Content-Type
   ```

2. **Or edit the N8N config file**
   ```json
   {
     "cors": {
       "origin": ["https://pangeafate.github.io"],
       "credentials": true,
       "methods": ["POST", "GET", "OPTIONS"],
       "allowedHeaders": ["Content-Type", "Accept"]
     }
   }
   ```

### Method 4: Allow Multiple Origins (if needed)

To allow both localhost (for development) and GitHub Pages:

```javascript
// In your HTTP Response node
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'https://pangeafate.github.io'
];

const origin = $input.headers['origin'];
if (allowedOrigins.includes(origin)) {
  $response.headers['Access-Control-Allow-Origin'] = origin;
}
```

## Testing Your Configuration

1. **Activate your workflow** in N8N
2. **Test from browser console** at https://pangeafate.github.io:
   ```javascript
   fetch('https://n8n.lakestrom.com/webhook/get_cvjd', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({test: true})
   }).then(r => console.log('Success:', r))
     .catch(e => console.log('Error:', e));
   ```

3. **Check browser DevTools**
   - Network tab should show successful POST request
   - No CORS errors in console

## Troubleshooting

### If still getting CORS errors:

1. **Verify webhook is active** - Check the workflow is enabled
2. **Check HTTPS** - Both sites must use HTTPS
3. **Clear browser cache** - CORS policies can be cached
4. **Check N8N logs** - Look for any error messages

### Common Issues:

- **Webhook returns 404**: Workflow not active
- **No Access-Control headers**: CORS not configured
- **Origin not allowed**: Check exact URL spelling

## Alternative: Use Proxy Server

If you cannot modify the N8N webhook, use the proxy server approach:

1. Deploy the included proxy server (`proxy-server.js`)
2. Set `VITE_USE_PROXY_IN_PROD=true` in your GitHub repository secrets
3. Set `VITE_PROXY_SERVER_URL` to your proxy server URL

## Security Considerations

- Only allow specific origins (not `*`)
- Use HTTPS for both webhook and application
- Consider adding authentication tokens
- Monitor webhook usage for abuse

## Contact N8N Support

If you're using N8N Cloud and cannot modify CORS settings, contact their support to whitelist your domain.