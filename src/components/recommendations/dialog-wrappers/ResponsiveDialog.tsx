
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children 
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto">
            <div className="px-4 pb-6">{children}</div>
          </div>
          <DrawerFooter className="pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="overflow-auto flex-1 pr-1 max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveDialog;
