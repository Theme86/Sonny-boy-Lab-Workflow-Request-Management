"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((response) => setIsAuthenticated(response.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#17231f]">
      <header className="sticky top-0 z-20 border-b border-[#d9d7ca] bg-[#f4f1e9]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-[#17231f]">
            LAB
          </Link>
          <div className="flex min-h-10 items-center">
            {isAuthenticated === null ? (
              <span className="text-sm text-[#66736c]">Checking access...</span>
            ) : (
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="rounded-full bg-[#d9ef67] px-5 py-2.5 text-sm font-semibold text-[#17231f] transition hover:bg-[#c9e34d]"
              >
                {isAuthenticated ? "Go to app" : "Login"}
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate flex min-h-[calc(100vh-73px)] items-end overflow-hidden px-6 py-12 lg:px-10 lg:py-16">
          <Image
            src="/landing/Laboratories.jpg"
            alt="A bright modern laboratory with research equipment"
            fill
            priority
            className="-z-20 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[#10251f]/45" />
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-2xl text-white">
              <p className="mb-5 text-sm font-medium uppercase tracking-[0.3em] text-[#d9ef67]">
                Research, Screwed
              </p>
              <h1 className="text-6xl font-semibold tracking-[-0.04em] sm:text-8xl">
                lab
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/85 sm:text-xl">
                description
              </p>
            </div>
          </div>
          
        </section>
      </main>
    </div>
  );
}
