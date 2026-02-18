"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";

interface QuickCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (lines: string[], asChain: boolean) => Promise<void>;
}

export function QuickCaptureModal({ open, onClose, onCapture }: QuickCaptureModalProps) {
  const [text, setText] = useState("");
  const [asChain, setAsChain] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCapture = async () => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    try {
      setLoading(true);
      await onCapture(lines, asChain);
      setText("");
      onClose();
    } catch (error) {
      console.error("Error capturing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Capture
          </DialogTitle>
          <DialogDescription>
            Dump your thoughts quickly. Each line becomes a node.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="capture-text">Your Ideas</Label>
            <Textarea
              id="capture-text"
              placeholder="Research competitors&#10;Define MVP features&#10;Create wireframes&#10;Build prototype"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: One idea per line
            </p>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="chain-mode">Create as Connected Chain</Label>
              <p className="text-xs text-muted-foreground">
                Each node connects to the next (Node 1 → Node 2 → Node 3)
              </p>
            </div>
            <Switch
              id="chain-mode"
              checked={asChain}
              onCheckedChange={setAsChain}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCapture} disabled={loading || text.trim().length === 0}>
              {loading ? "Creating..." : `Create ${text.split("\n").filter(l => l.trim()).length} Nodes`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
