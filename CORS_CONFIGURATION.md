# CORS Configuration Guide for AgentiCV

This guide explains how to configure CORS (Cross-Origin Resource Sharing) handling for the AgentiCV frontend application to work with N8N webhook endpoints.

## Overview

The AgentiCV frontend can operate in two modes:
1. **Direct Webhook Mode**: Calls N8N webhooks directly (can cause CORS errors on GitHub Pages)
2. **Proxy Mode**: Routes requests through a proxy server to bypass CORS restrictions

## Configuration Options

### Environment Variables

Add these variables to your `.env` file:

```bash
# N8N webhook URL (required)
VITE_N8N_COMPLETE_ANALYSIS_URL=https://n8n.lakestrom.com/webhook/get_cvjd

# Force proxy usage even in production (optional, default: false)
VITE_USE_PROXY_IN_PROD=true

# Proxy server URL (optional, default: http://localhost:3002)
VITE_PROXY_SERVER_URL=http://localhost:3002
```

### Mode Selection Logic

The application automatically selects the appropriate mode:

- **Development** (`localhost`): Always uses proxy mode
- **Production** (GitHub Pages/deployed): 
  - Uses direct webhook by default
  - Uses proxy if `VITE_USE_PROXY_IN_PROD=true`

## Common CORS Issues and Solutions

### Problem: GitHub Pages CORS Blocking

When deployed on GitHub Pages, you might see this error:
```
CORS error: The N8N webhook at https://n8n.lakestrom.com/webhook/get_cvjd 
is not configured to accept requests from this domain (https://username.github.io).
```

### Solutions

#### Option 1: Enable Proxy Mode in Production
Set `VITE_USE_PROXY_IN_PROD=true` in your environment variables and ensure your proxy server is accessible from the internet.

#### Option 2: Configure N8N CORS Headers
In your N8N workflow, add a "Set" node before the webhook response with:
```json
{
  "headers.Access-Control-Allow-Origin": "https://your-domain.github.io",
  "headers.Access-Control-Allow-Methods": "POST, OPTIONS",
  "headers.Access-Control-Allow-Headers": "Content-Type"
}
```

#### Option 3: Use a Different Hosting Platform
Consider using platforms like Vercel, Netlify, or Heroku that support CORS proxying or serverless functions.

## Error Messages and Troubleshooting

### Enhanced Error Detection

The application now provides detailed error messages:

- **CORS Errors**: Clear indication with suggested solutions
- **Network Errors**: Distinction between proxy and direct webhook failures  
- **N8N Webhook Errors**: Specific handling for inactive workflows
- **Data Validation Errors**: Prevents processing of incomplete responses

### No More Fake Data

The application will **never** return placeholder data like "CV content processed" when:
- Webhook calls fail
- CORS errors occur
- Network issues happen
- N8N returns incomplete data

All failures result in clear error messages instead of fake success responses.

## Testing Your Configuration

### Development Testing
```bash
npm run dev
# Application should use proxy mode automatically
```

### Production Testing
1. Deploy your application
2. Try the analysis feature
3. Check browser console for any CORS errors
4. Use the retry button if initial attempts fail

### Environment Variable Testing
You can test different configurations by setting:
```bash
# Test proxy mode in production
VITE_USE_PROXY_IN_PROD=true npm run build
npm run preview

# Test direct mode (default)
VITE_USE_PROXY_IN_PROD=false npm run build  
npm run preview
```

## Best Practices

1. **Always test both modes** during development
2. **Monitor error logs** in production to catch CORS issues early
3. **Keep proxy server updated** if using proxy mode
4. **Configure N8N CORS headers** for optimal performance
5. **Use environment-specific configurations** for different deployment targets

## Security Considerations

- Only configure CORS for trusted domains
- Keep webhook URLs secure and don't expose them in client-side code
- Use HTTPS for all production deployments
- Regularly update proxy server dependencies if self-hosting

## Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify environment variable configuration
3. Test N8N webhook directly using tools like Postman
4. Ensure proxy server is accessible if using proxy mode