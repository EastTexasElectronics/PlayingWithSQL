'use client'

import SqlExplorer from "@/components/sql-explorer";
import { WelcomeModal } from "@/components/welcome-modal";

export default function HomePage() {
  return (
    <main>
      <WelcomeModal />
      <SqlExplorer />
    </main>
  );
}
