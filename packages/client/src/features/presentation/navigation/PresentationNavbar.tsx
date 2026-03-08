import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  LayoutGrid,
  NotebookText,
  PenLine,
  Radio,
} from "lucide-react";
import { useState } from "react";
import { useDraw } from "../draw/DrawProvider";
import { ChromeIconButton } from "../../../ui/primitives/ChromeIconButton";

function DrawControls() {
  const draw = useDraw();

  return (
    <ChromeIconButton
      onClick={draw.toggleEnabled}
      title="Toggle draw (D)"
      aria-label="Toggle draw mode"
      tone={draw.enabled ? "active" : "default"}
      size="sm"
      radius="soft"
    >
      <PenLine size={16} />
    </ChromeIconButton>
  );
}

export function PresentationNavbar({
  slideTitle,
  currentIndex,
  total,
  canPrev,
  canNext,
  showPresenterModeButton,
  overviewOpen,
  notesOpen,
  shortcutsOpen,
  canOpenOverview,
  onEnterPresenterMode,
  onToggleOverview,
  onToggleNotes,
  onToggleShortcuts,
  onPrev,
  onNext,
  canControl,
}: {
  slideTitle?: string;
  currentIndex: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  showPresenterModeButton: boolean;
  overviewOpen: boolean;
  notesOpen: boolean;
  shortcutsOpen: boolean;
  canOpenOverview: boolean;
  onEnterPresenterMode?: () => void;
  onToggleOverview: () => void;
  onToggleNotes: () => void;
  onToggleShortcuts: () => void;
  onPrev: () => void;
  onNext: () => void;
  canControl: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute bottom-0 left-4 z-40"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div aria-hidden className="h-14 w-20 rounded-t-2xl" />
      <nav
        className={`absolute bottom-0 left-0 flex items-center gap-1 rounded-t-xl border border-b-0 border-slate-200 bg-white/95 px-2 py-1.5 text-slate-800  ring-1 ring-black/5 backdrop-blur-md transition-[opacity,transform] ${open ? "pointer-events-auto translate-y-0 opacity-100 duration-0" : "pointer-events-none translate-y-2 opacity-0 duration-180"}`}
        aria-label="Presentation navbar"
      >
        <ChromeIconButton
          title={`${slideTitle ?? "Slide"} (${currentIndex + 1}/${total})`}
          aria-label="Current slide info"
          size="sm"
          radius="soft"
        >
          <BookOpenText size={15} />
        </ChromeIconButton>
        <ChromeIconButton
          onClick={onToggleShortcuts}
          title="Keyboard shortcuts (?)"
          aria-label="Toggle keyboard shortcuts"
          tone={shortcutsOpen ? "active" : "default"}
          size="sm"
          radius="soft"
        >
          <Keyboard size={15} />
        </ChromeIconButton>
        <ChromeIconButton
          onClick={onToggleNotes}
          title="Notes Workspace (N)"
          aria-label="Toggle notes workspace"
          tone={notesOpen ? "active" : "default"}
          size="sm"
          radius="soft"
          disabled={!canControl}
        >
          <NotebookText size={16} />
        </ChromeIconButton>
        <ChromeIconButton
          onClick={onToggleOverview}
          title="Quick Overview (O)"
          aria-label="Toggle quick overview"
          tone={overviewOpen ? "active" : "default"}
          size="sm"
          radius="soft"
          disabled={!canOpenOverview}
        >
          <LayoutGrid size={16} />
        </ChromeIconButton>
        {showPresenterModeButton && (
          <ChromeIconButton
            onClick={onEnterPresenterMode}
            title="Enter presenter mode"
            aria-label="Enter presenter mode"
            size="sm"
            radius="soft"
          >
            <Radio size={15} />
          </ChromeIconButton>
        )}
        {canControl && (
          <>
            <ChromeIconButton
              onClick={onPrev}
              disabled={!canPrev}
              title="Previous slide"
              aria-label="Previous slide"
              size="sm"
              radius="soft"
            >
              <ChevronLeft size={16} />
            </ChromeIconButton>
            <ChromeIconButton
              onClick={onNext}
              disabled={!canNext}
              title="Next slide"
              aria-label="Next slide"
              size="sm"
              radius="soft"
            >
              <ChevronRight size={16} />
            </ChromeIconButton>
            <div className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
            <DrawControls />
          </>
        )}
      </nav>
    </div>
  );
}
