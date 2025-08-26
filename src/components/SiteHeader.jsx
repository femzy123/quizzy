'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function SiteHeader({ isAuthed }) {
  const [open, setOpen] = useState(false);
  const ctaHref = isAuthed ? '/dashboard' : '/auth/login';

  const NavLinks = ({ onClick }) => (
    <>
      <a href="#features" onClick={onClick} className="hover:opacity-80">Features</a>
      <a href="#how" onClick={onClick} className="hover:opacity-80">How it works</a>
      <a href="#faq" onClick={onClick} className="hover:opacity-80">FAQ</a>
      <a href="#contact" onClick={onClick} className="hover:opacity-80">Contact</a>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">Quizzy</Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex text-sm">
          <NavLinks />
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAuthed ? (
            <Button asChild variant="secondary"><Link href="/dashboard">Dashboard</Link></Button>
          ) : (
            <Button asChild variant="secondary"><Link href="/auth/login">Sign in</Link></Button>
          )}
          <Button asChild><Link href={ctaHref}>Get started</Link></Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2"
          aria-label="Toggle menu"
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
            <div className="flex flex-col gap-3 text-sm">
              <NavLinks onClick={() => setOpen(false)} />
            </div>
            <div className="flex gap-3 pt-2">
              {isAuthed ? (
                <Button asChild variant="secondary" className="flex-1">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="secondary" className="flex-1">
                  <Link href="/auth/login" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
              )}
              <Button asChild className="flex-1">
                <Link href={ctaHref} onClick={() => setOpen(false)}>Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
