"use client";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <main className="flex flex-col h-screen justify-between items-center pt-17">
      <Header />
      <Footer />
    </main>
  );
}
