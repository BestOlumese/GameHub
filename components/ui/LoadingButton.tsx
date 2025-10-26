"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // spinner icon

interface LoadingButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  isLoading?: boolean;
  loadingText?: string; // optional text while loading
  children: React.ReactNode;
  disabled?: boolean;
}

export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(({ isLoading, loadingText, children, disabled, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isLoading ? loadingText ?? children : children}
    </Button>
  );
});

LoadingButton.displayName = "LoadingButton";
