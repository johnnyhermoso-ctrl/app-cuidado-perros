export function StatusMessage({ type, message }: { type: 'success' | 'error'; message: string }) {
  return <div className={type === 'success' ? 'status success' : 'status error'}>{message}</div>;
}
