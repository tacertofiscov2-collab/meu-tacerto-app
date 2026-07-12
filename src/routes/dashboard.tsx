import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard (em construção)</h1>
    </div>
  );
}
