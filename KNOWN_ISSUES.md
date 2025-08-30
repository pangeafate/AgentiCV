# Known Issues with AgentiCV Deployment

## Critical Issue: N8N Webhook Not Being Triggered in Production

**Status:** 🔴 Active  
**Environment:** GitHub Pages (https://pangeafate.github.io/AgentiCV/)  
**Last Updated:** 2025-08-30

### Problem Description
When the application is deployed to GitHub Pages, the N8N webhook at `https://n8n.lakestrom.com/webhook/get_cvjd` is not being triggered, and mock/placeholder data is being returned instead of real analysis results. The N8N dashboard shows no webhook activations.

## Three Strong Hypotheses

### 1. 🔍 **Environment Variables Not Being Injected During Build**
**Hypothesis:** The GitHub Actions workflow is not properly injecting the N8N webhook URL during the build process.

**Evidence:**
- The `.github/workflows/deploy.yml` only sets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Missing: `VITE_N8N_COMPLETE_ANALYSIS_URL` in the GitHub Actions environment variables
- The production bundle falls back to the hardcoded default URL

**Impact:** 
- The app uses the default/fallback N8N URL from the code instead of the environment variable
- Even if CORS is configured, the webhook URL might be incorrect

**Solution:**
```yaml
# Add to .github/workflows/deploy.yml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  VITE_N8N_COMPLETE_ANALYSIS_URL: ${{ secrets.VITE_N8N_COMPLETE_ANALYSIS_URL }}
```

### 2. 🚫 **Silent CORS Failure with Response Type 'opaque'**
**Hypothesis:** The browser is blocking the request due to CORS, but the error is being silently handled, causing the app to use fallback data.

**Evidence:**
- CORS requests that fail often return `response.type = 'opaque'` with `status = 0`
- The code creates a `processedData` object even when parsing fails
- Lines 171-178 in AnalysisControl.jsx show fallback data structure being created

**Impact:**
- The fetch appears to succeed but returns an opaque response
- The app can't read the actual response and falls back to creating mock data
- Users see what appears to be successful analysis but it's placeholder data

**Detection:**
```javascript
// The response is likely opaque if:
response.type === 'opaque' || 
response.status === 0 ||
!response.headers.get('content-type')
```

### 3. 🔄 **Browser Preflight Request (OPTIONS) Not Handled by N8N**
**Hypothesis:** The browser is sending a preflight OPTIONS request that N8N webhook is not configured to handle, causing the actual POST request to never be sent.

**Evidence:**
- Complex CORS requests require preflight OPTIONS checks
- N8N webhooks might only handle POST/GET by default
- The browser silently fails the POST if OPTIONS returns 404/405

**Impact:**
- The browser sends OPTIONS → Gets 404/405 → Never sends the actual POST
- No webhook activation appears in N8N dashboard
- The app's error handling creates fallback data

**Solution in N8N:**
- Add an IF node to check `{{ $input.method }} === 'OPTIONS'`
- Return empty response with proper CORS headers for OPTIONS
- Continue normal flow for POST requests

## Other Known Issues

### 1. Mock Mode Confusion
**Problem:** When Supabase is not configured, the app shows "MOCK MODE" but doesn't clearly indicate that N8N analysis won't work either.
**Impact:** Users might think only file upload is mocked, not realizing analysis is also affected.

### 2. Proxy Server Requirement Not Documented
**Problem:** The proxy server (`proxy-server.js`) is required for local development but this isn't clearly documented.
**Impact:** Developers can't test N8N integration locally without running the proxy.

### 3. Error Messages Don't Show in UI
**Problem:** Detailed error information is only logged to console, not shown to users.
**Impact:** Users don't understand why analysis fails without opening DevTools.

## Deployment Checklist

To ensure successful deployment with N8N integration:

1. **GitHub Repository Secrets Required:**
   - [ ] `VITE_SUPABASE_URL`
   - [ ] `VITE_SUPABASE_ANON_KEY`
   - [ ] `VITE_N8N_COMPLETE_ANALYSIS_URL` ⚠️ Currently missing!
   - [ ] `VITE_USE_PROXY_IN_PROD` (optional, for proxy mode)
   - [ ] `VITE_PROXY_SERVER_URL` (if using proxy in production)

2. **N8N Webhook Configuration:**
   - [ ] Webhook is active/enabled in N8N
   - [ ] CORS headers configured for `https://pangeafate.github.io`
   - [ ] OPTIONS request handling implemented
   - [ ] Response includes proper `Access-Control-Allow-Origin` header

3. **Testing Steps:**
   - [ ] Open browser DevTools Network tab
   - [ ] Check for OPTIONS preflight request
   - [ ] Verify POST request is sent (not blocked)
   - [ ] Check response headers for CORS
   - [ ] Verify N8N dashboard shows activation

## Debugging Commands

### Check what's in production bundle:
```bash
curl -s "https://pangeafate.github.io/AgentiCV/" | grep -o "assets/index-[^\"]*\.js"
curl -s "https://pangeafate.github.io/AgentiCV/assets/index-HASH.js" | grep -o "n8n[^\"']*"
```

### Test N8N webhook directly:
```bash
curl -X POST https://n8n.lakestrom.com/webhook/get_cvjd \
  -H "Content-Type: application/json" \
  -H "Origin: https://pangeafate.github.io" \
  -d '{"test": true}'
```

### Check GitHub secrets:
```bash
gh secret list
```

## Temporary Workarounds

1. **Use Proxy Mode in Production:**
   - Deploy a proxy server (e.g., on Heroku, Vercel)
   - Set `VITE_USE_PROXY_IN_PROD=true`
   - Set `VITE_PROXY_SERVER_URL` to proxy URL

2. **Use Development Mode:**
   - Run locally with `npm run dev`
   - Start proxy with `node proxy-server.js`
   - Works without CORS issues

3. **Browser Extension:**
   - Use a CORS-disabling browser extension (development only)
   - Not recommended for production users

## References

- [N8N Webhook Documentation](https://docs.n8n.io/core-nodes/n8n-nodes-base.webhook/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [CORS MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)