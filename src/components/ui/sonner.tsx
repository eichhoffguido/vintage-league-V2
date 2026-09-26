import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position={isMobile ? "bottom-right" : "top-right"}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!rounded-none group-[.toaster]:bg-nero group-[.toaster]:text-avorio group-[.toaster]:border-nero group-[.toaster]:shadow-none",
          description: "group-[.toast]:text-avorio/80 [[data-type=error]_&]:!text-destructive-foreground/90",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-sabbia group-[.toast]:text-nero",
          error:
            "!bg-destructive !text-destructive-foreground !border-destructive",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
