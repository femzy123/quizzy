"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Loader2 } from "lucide-react";

export default function QuizCardActions({ quizId, onDelete, onDuplicate }) {
  const [pending, setPending] = useState(null); // 'delete' | 'dup' | null

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirm("Delete this quiz? All its attempts will also be removed.")) return;
    try {
      setPending("delete");
      const fd = new FormData();
      fd.set("quizId", quizId);
      await onDelete(fd);
    } finally {
      setPending(null);
    }
  }

  async function handleDuplicate(e) {
    e.preventDefault();
    try {
      setPending("dup");
      const fd = new FormData();
      fd.set("quizId", quizId);
      await onDuplicate(fd);
      // optionally toast success
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={!!pending}>
        {pending === "dup" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
        Duplicate
      </Button>
      <Button size="sm" variant="destructive" onClick={handleDelete} disabled={!!pending}>
        {pending === "delete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
        Delete
      </Button>
    </div>
  );
}
