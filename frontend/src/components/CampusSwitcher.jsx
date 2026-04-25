import React, { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export const CampusSwitcher = ({ campuses, current, onSelect, variant = "header" }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const senior = campuses.filter((c) => c.tier === "senior");
  const community = campuses.filter((c) => c.tier === "community");
  const active = campuses.find((c) => c.slug === current);

  const handleSelect = (slug) => {
    setOpen(false);
    if (onSelect) onSelect(slug);
    else navigate(`/campus/${slug}`);
  };

  const triggerClasses =
    variant === "hero"
      ? "flex items-center gap-3 px-5 py-3 rounded-full bg-white border border-cuny-navy/15 hover:border-cuny-navy text-cuny-navy text-base font-medium shadow-sm hover:shadow-md transition"
      : "flex items-center gap-2 px-3.5 py-2 rounded-full border border-ink-900/10 bg-white/70 hover:bg-white text-cuny-navy text-sm font-medium transition";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button data-testid="campus-switcher-trigger" className={triggerClasses}>
          <span className="w-2 h-2 rounded-full" style={{ background: active?.color || "#003366" }} />
          <span className="font-serif">{active?.short || "Select Campus"}</span>
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={variant === "hero" ? "center" : "end"}
        className="w-[340px] p-0 border-cuny-navy/10 shadow-xl"
        data-testid="campus-switcher-popover"
      >
        <Command>
          <div className="flex items-center px-3 border-b border-ink-900/5">
            <Search className="w-4 h-4 text-ink-500 mr-2" />
            <CommandInput
              placeholder="Search CUNY colleges..."
              className="h-11 border-0 focus:ring-0"
              data-testid="campus-switcher-input"
            />
          </div>
          <CommandList className="max-h-[360px]">
            <CommandEmpty>No campus found.</CommandEmpty>
            <CommandGroup heading="Senior Colleges">
              {senior.map((c) => (
                <CommandItem
                  key={c.slug}
                  value={`${c.name} ${c.short}`}
                  onSelect={() => handleSelect(c.slug)}
                  data-testid={`campus-option-${c.slug}`}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: c.color }} />
                  <div className="flex-1">
                    <div className="font-serif text-cuny-navy text-sm">{c.short}</div>
                    <div className="text-[11px] text-ink-500 truncate">{c.name}</div>
                  </div>
                  {current === c.slug && <Check className="w-4 h-4 text-cuny-gold" />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Community Colleges">
              {community.map((c) => (
                <CommandItem
                  key={c.slug}
                  value={`${c.name} ${c.short}`}
                  onSelect={() => handleSelect(c.slug)}
                  data-testid={`campus-option-${c.slug}`}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: c.color }} />
                  <div className="flex-1">
                    <div className="font-serif text-cuny-navy text-sm">{c.short}</div>
                    <div className="text-[11px] text-ink-500 truncate">{c.name}</div>
                  </div>
                  {current === c.slug && <Check className="w-4 h-4 text-cuny-gold" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CampusSwitcher;
