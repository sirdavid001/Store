import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
  contentClassName,
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={clsx(
          "inline-flex w-full items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white outline-none transition hover:border-white/20 data-[placeholder]:text-slate-300",
          triggerClassName,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-slate-300" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className={clsx(
            "z-50 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur",
            contentClassName,
          )}
        >
          <Select.Viewport className="space-y-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-4 py-2.5 text-sm text-white outline-none transition hover:bg-white/10 focus:bg-white/10"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-4">
                  <Check className="h-4 w-4 text-sky-300" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
