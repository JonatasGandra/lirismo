import { Ornament } from "@/components/lily/Ornament";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <Ornament className="mb-6" />
      <p className="font-title text-title-md font-medium">{title}</p>
      <p className="mt-2 font-poem text-lg italic text-muted">{text}</p>
    </div>
  );
}
