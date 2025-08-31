# Google Drive Integration Setup

This guide will help you set up Google Drive integration for your classroom seater app, allowing you to import CSV files directly from Google Drive.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your CSV files stored in a Google Drive folder

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Google Drive API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**

### 3. Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Enter a name (e.g., "classroom-seater-drive-access")
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

### 4. Generate Service Account Key

1. Click on your newly created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file

### 5. Extract Credentials from JSON

Open the downloaded JSON file and find these two values:
- `client_email` - this is your service account email
- `private_key` - this is your private key (includes `\n` characters)

### 6. Set Environment Variables

Create a `.env` file in your project root (or update existing one):

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
```

**Important:** Keep the `\n` characters in the private key exactly as they appear in the JSON file.

### 7. Share Google Drive Folder

1. Go to Google Drive and navigate to the folder containing your CSV files
2. Right-click the folder and select **Share**
3. Add the service account email (from step 5) as a **Viewer**
4. Click **Send**

### 8. Get Folder ID

1. Open your shared folder in Google Drive
2. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Copy the folder ID from the URL

## Using the Integration

1. Start your application
2. Go to the student import section
3. Click on the **Google Drive** tab
4. Enter your folder ID
5. Click the refresh button to load CSV files
6. Click **Import** on any CSV file to import students

## Troubleshooting

### "Google Drive integration not configured"
- Check that both environment variables are set correctly
- Restart your server after adding environment variables

### "Google Drive access failed"
- Verify the service account email is correct
- Make sure the private key includes all `\n` characters
- Ensure the Google Drive API is enabled in your project

### "Failed to list Google Drive files"
- Check that the folder ID is correct
- Verify the folder is shared with the service account email
- Make sure the service account has at least Viewer access

### "No CSV files found"
- Ensure your files have the `.csv` extension
- Check that files are directly in the shared folder (not in subfolders)
- Verify files are not in the trash

## Security Notes

- Keep your service account key secure and never commit it to version control
- The service account only has read access to shared folders
- You can revoke access anytime by removing the service account from folder sharing
- Consider using environment-specific service accounts for production deployments
