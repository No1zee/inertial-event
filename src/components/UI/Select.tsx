import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
}

export function Select({ className, options, label, ...props }: SelectProps) {
  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none rounded-lg bg-zinc-800 border border-white/5 px-4 py-2.5 pr-10 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors cursor-pointer",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-800">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
            <ChevronDown size={16} />
        </div>
      </div>
    </div>
  )
}
