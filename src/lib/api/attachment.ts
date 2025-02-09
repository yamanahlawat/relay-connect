import client from '@/lib/api/client';
import { AttachmentRead } from '@/types/attachment';

/**
 * Upload a single file attachment
 */
export async function uploadAttachment(file: File, folder: string): Promise<AttachmentRead> {
  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await client.POST('/api/v1/attachments/{folder}/', {
    params: {
      path: { folder },
    },
    body: formData,
  });

  if (error) {
    throw new Error(`Error uploading attachment: ${error.detail}`);
  }

  return data;
}
