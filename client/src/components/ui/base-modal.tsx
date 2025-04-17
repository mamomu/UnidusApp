import { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
}: BaseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-lg max-h-[90vh] overflow-auto p-0 ${className}`}
      >
        {title && (
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">{title}</h3>
            <Button
              size="icon"
              variant="ghost"
              className="p-2 bg-white/90 hover:bg-white rounded-full h-auto w-auto"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && (
          <div className="p-4 border-t border-neutral-200">{footer}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
