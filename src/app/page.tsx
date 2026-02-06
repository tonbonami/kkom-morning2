import DashboardClient from '@/components/dashboard/dashboard-client';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-6">
      <div className="w-full max-w-[640px]">
        <DashboardClient />
      </div>
    </main>
  );
}
