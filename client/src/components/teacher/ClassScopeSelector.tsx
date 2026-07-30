'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Layers, Check } from 'lucide-react';
import { useClassScope, ScopePair } from '../../context/ClassScopeContext';

interface ClassScopeSelectorProps {
  variant?: 'sidebar' | 'page';
}

export default function ClassScopeSelector({ variant = 'sidebar' }: ClassScopeSelectorProps) {
  const { availableScopes, scope, setScope, loading } = useClassScope();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click + reposition on scroll/resize
  useEffect(() => {
    if (!open) return;

    function updatePos() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 280) });
    }
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  if (loading && !scope) {
    return <div className="text-xs text-[#a0a0a0] animate-pulse">Loading classes…</div>;
  }

  if (availableScopes.length === 0) {
    return <div className="text-xs text-[#a0a0a0] italic">No classes yet</div>;
  }

  const handleSelect = (s: ScopePair) => {
    setScope(s);
    setOpen(false);
    if (typeof window !== 'undefined') window.location.reload();
  };

  // Render the menu via a portal so it escapes any `overflow: hidden` parent
  // (the welcome card uses overflow-hidden to clip its decorative blur).
  const menu = open && menuPos ? createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
      className="bg-card border-2 border-border rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="px-4 py-2.5 text-[10px] uppercase font-bold text-[#a0a0a0] border-b border-border">
        Switch to another class
      </div>
      <div className="max-h-72 overflow-y-auto">
        {availableScopes.map((s) => {
          const isActive = scope && s.className === scope.className && s.section === scope.section;
          return (
            <button
              key={`${s.className}-${s.section}`}
              onClick={() => handleSelect(s)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-left ${
                isActive ? 'bg-primary/15 text-primary font-bold' : 'text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4 opacity-70" />
                <span className="font-semibold">{s.className}</span>
                <span className="text-[#a0a0a0]">•</span>
                <span className="font-mono">Section {s.section}</span>
              </span>
              {isActive && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  if (variant === 'page') {
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-card border-2 border-primary/40 text-white hover:bg-primary/10 hover:border-primary transition-all shadow-lg shadow-primary/10 min-w-[280px]"
        >
          <span className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider leading-none mb-1">
                Active Class
              </div>
              <div className="text-base font-bold leading-none">
                {scope ? `${scope.className} • Section ${scope.section}` : 'Select Class'}
              </div>
            </div>
          </span>
          <ChevronDown className={`w-5 h-5 text-[#a0a0a0] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>
        {menu}
      </>
    );
  }

  // Sidebar variant
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold"
      >
        <span className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          {scope ? `${scope.className} • ${scope.section}` : 'Select Class'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}
