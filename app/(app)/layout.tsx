export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ paddingBottom: 88 }}>
      {children}
    </main>
  );
}
