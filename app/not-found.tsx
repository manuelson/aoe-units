import Link from "next/link";
import "./globals.css";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="flex min-h-[100dvh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="font-mono text-7xl font-semibold text-primary">404</p>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              That unit does not exist
            </h1>
            <p className="mt-2 text-muted-foreground">
              The page may have moved, or the unit name is spelled differently.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Back to AoeUnits
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
