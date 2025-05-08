
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface YouTubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  title?: string;
}

const YouTubeDialog: React.FC<YouTubeDialogProps> = ({
  open,
  onOpenChange,
  videoId,
  title = 'Visualização de vídeo'
}) => {
  // Formatar a URL do YouTube corretamente
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-0">
        <DialogHeader className="p-4 bg-black text-white">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeDialog;
