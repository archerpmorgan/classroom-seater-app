# Deployment Guide

This guide explains how to deploy the Classroom Seating Chart Generator with separate frontend and backend services.

## Architecture Overview

When deployed, the application can run with:
- **Frontend**: Static files served by a web server (Vercel, Netlify, etc.)
- **Backend**: API server running separately (Heroku, Railway, etc.)

## Environment Variables

### Frontend Environment Variables

Create a `.env.local` file in the `client/` directory:

```bash
# API Base URL - Point to your backend API server
VITE_API_BASE_URL=https://your-api-server.com

# Examples:
# VITE_API_BASE_URL=https://classroom-seater-api.herokuapp.com
# VITE_API_BASE_URL=https://api.yourdomain.com
# VITE_API_BASE_URL=https://your-backend-service.railway.app
```

**Important**: 
- In development, leave `VITE_API_BASE_URL` empty to use same-origin requests
- In production, set it to your backend API URL

### Backend Environment Variables

Create a `.env` file in the root directory:

```bash
# Database connection
DATABASE_URL=postgresql://username:password@host:port/database

# Server configuration
PORT=5000
NODE_ENV=production
```

**Note**: The server automatically binds to `0.0.0.0` in production mode, which is required for cloud hosting platforms like Render.

## Deployment Options

### Option 1: Separate Frontend and Backend

#### Frontend Deployment (Vercel, Netlify, etc.)

1. **Build the frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy the `dist/public` folder** to your hosting service

3. **Set environment variables** in your hosting platform:
   - `VITE_API_BASE_URL`: Your backend API URL

#### Backend Deployment (Heroku, Railway, Render, etc.)

1. **Deploy the backend** to your hosting service

2. **Set environment variables** in your hosting platform:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `PORT`: Port number (usually auto-set by hosting platform)
   - `NODE_ENV`: `production`

#### Render-Specific Configuration

For Render deployments:

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `PORT`: Auto-set by Render (don't override)

The server automatically binds to `0.0.0.0` in production mode, which satisfies Render's requirements.

### Option 2: Monolithic Deployment

For simpler deployments, you can still run everything on one server:

1. **Set `VITE_API_BASE_URL` to empty** (uses same-origin requests)
2. **Deploy the entire application** to a single server
3. **Serve both frontend and API** from the same domain

## CORS Configuration

If deploying frontend and backend separately, ensure your backend allows CORS from your frontend domain:

```typescript
// In your backend server
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

## Build Commands

### Frontend Only
```bash
cd client
npm run build
```

### Backend Only
```bash
npm run build
```

### Full Application
```bash
npm run build
```

## Environment-Specific Configurations

### Development
- Frontend and backend run on same port (default: 5000)
- No `VITE_API_BASE_URL` needed
- Uses in-memory storage by default

### Production
- Frontend and backend can run on separate domains
- `VITE_API_BASE_URL` must be set to backend URL
- Requires persistent database (PostgreSQL)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows requests from frontend domain
2. **API Not Found**: Check `VITE_API_BASE_URL` is correct
3. **Database Connection**: Verify `DATABASE_URL` is valid
4. **Build Failures**: Ensure all environment variables are set

### Debug Mode

To debug API communication, check the browser's Network tab for:
- Request URLs (should include your API base URL)
- Response status codes
- CORS headers
