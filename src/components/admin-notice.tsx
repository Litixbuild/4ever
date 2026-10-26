export function AdminNotice({ notice }: { notice?: string }) {
  if (!notice) return null;
  return (
    <div className="notice notice-ok" role="status">
      {notice.slice(0, 200)}
    </div>
  );
}
