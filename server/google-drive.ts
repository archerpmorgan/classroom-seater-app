import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  mimeType?: string;
}

export class GoogleDriveService {
  private drive: any;
  private auth: JWT;

  constructor() {
    console.log('[GoogleDrive] Initializing Google Drive service...');
    console.log('[GoogleDrive] Service account email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET');
    console.log('[GoogleDrive] Private key:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length + ')' : 'NOT SET');
    
    // Initialize JWT auth with service account credentials
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    console.log('[GoogleDrive] Google Drive service initialized');
  }

  /**
   * List CSV and Excel files in a specific Google Drive folder
   */
  async listSpreadsheetFiles(folderId: string): Promise<GoogleDriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and (mimeType='text/csv' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel') and trashed=false`,
        fields: 'files(id,name,modifiedTime,size,mimeType)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing spreadsheet files from Google Drive:', error);
      throw new Error('Failed to list files from Google Drive');
    }
  }

  /**
   * @deprecated Use listSpreadsheetFiles instead
   */
  async listCSVFiles(folderId: string): Promise<GoogleDriveFile[]> {
    return this.listSpreadsheetFiles(folderId);
  }

  /**
   * Download file content from Google Drive (supports both CSV and Excel)
   */
  async downloadFileContent(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, {
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  /**
   * @deprecated Use downloadFileContent instead
   */
  async downloadCSVContent(fileId: string): Promise<string> {
    const buffer = await this.downloadFileContent(fileId);
    return buffer.toString('utf-8');
  }

  /**
   * Get file metadata from Google Drive
   */
  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,modifiedTime,size',
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata from Google Drive:', error);
      throw new Error('Failed to get file metadata from Google Drive');
    }
  }

  /**
   * Verify if the service can access Google Drive
   */
  async verifyAccess(): Promise<boolean> {
    try {
      console.log('[GoogleDrive] Verifying access to Google Drive...');
      console.log('[GoogleDrive] Auth email:', this.auth.email);
      console.log('[GoogleDrive] Auth scopes:', this.auth.scopes);
      
      const response = await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id)',
      });
      
      console.log('[GoogleDrive] Access verification successful');
      console.log('[GoogleDrive] Response:', JSON.stringify(response.data, null, 2));
      return true;
    } catch (error) {
      console.error('[GoogleDrive] Access verification failed:', error);
      if (error instanceof Error) {
        console.error('[GoogleDrive] Error message:', error.message);
        console.error('[GoogleDrive] Error stack:', error.stack);
      }
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
