import { google } from 'googleapis';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

export async function getOrCreateFolder(
  parentId: string,
  folderName: string
): Promise<string> {
  const drive = getDrive();

  const existing = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  return created.data.id!;
}

export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDrive();

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: require('stream').Readable.from(fileBuffer),
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  return {
    id: file.data.id!,
    webViewLink: file.data.webViewLink!,
  };
}

export async function moveFile(
  fileId: string,
  newParentId: string
): Promise<void> {
  const drive = getDrive();

  const file = await drive.files.get({
    fileId,
    fields: 'parents',
    supportsAllDrives: true,
  });

  const previousParents = file.data.parents?.join(',') || '';

  await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: previousParents,
    supportsAllDrives: true,
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}

export function getEditorFolderPath(editorName: string): string[] {
  const now = new Date();
  const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const monthDay = now.toLocaleString('en-US', { month: 'long', day: 'numeric' });
  return [editorName, monthYear, monthDay];
}

export async function getOrCreateNestedFolder(
  rootFolderId: string,
  pathSegments: string[]
): Promise<string> {
  let currentParentId = rootFolderId;
  for (const segment of pathSegments) {
    currentParentId = await getOrCreateFolder(currentParentId, segment);
  }
  return currentParentId;
}
