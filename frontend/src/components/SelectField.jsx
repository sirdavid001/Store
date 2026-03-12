import * as Select from "@radix-ui/react-select";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";

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
          "inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 data-[placeholder]:text-gray-400",
          triggerClassName,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className={clsx(
            "z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl",
            contentClassName,
          )}
        >
          <Select.Viewport className="space-y-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none transition hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-4">
                  <Check className="h-4 w-4 text-blue-600" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
