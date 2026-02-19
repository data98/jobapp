'use client';

import { LocaleSwitcher } from './LocaleSwitcher';
import { UserMenu } from './UserMenu';

interface NavbarProps {
  showUserMenu?: boolean;
}

export function Navbar({ showUserMenu = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 gap-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        {showUserMenu && <UserMenu />}
      </div>
    </header>
  );
}
