import FilePreview from '@/components/FilePreview/FilePreview';
import type { components } from '@/lib/api/schema';
import { FilePreviewData } from '@/types/attachment';

type AttachmentRead = components['schemas']['AttachmentRead'];

interface MessageAttachmentsProps {
  attachments: AttachmentRead[];
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments?.length) return null;

  // Transform each AttachmentRead into the minimal FilePreviewData shape.
  const filePreviewData: FilePreviewData[] = attachments.map((attachment) => ({
    id: attachment.id,
    file_name: attachment.file_name,
    absolute_url: attachment.absolute_url,
    status: 'success', // since these attachments have been successfully uploaded
  }));

  return <FilePreview files={filePreviewData} showPreview imageSize="lg" />;
}
