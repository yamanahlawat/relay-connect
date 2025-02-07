import FilePreview from '@/components/FilePreview/FilePreview';
import type { components } from '@/lib/api/schema';

type AttachmentRead = components['schemas']['AttachmentRead'];

interface MessageAttachmentsProps {
  attachments: AttachmentRead[];
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments?.length) return null;

  // Convert attachments to FileOrUrl format expected by FilePreview
  const fileList = attachments.map((attachment) => ({
    id: attachment.id,
    url: attachment.absolute_url,
    name: attachment.file_name,
  }));

  return <FilePreview files={fileList} showPreview={true} imageSize="lg" />;
}
