import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PLATAFORMAS } from '@/lib/constants';

export function PlataformaButtons() {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {PLATAFORMAS.map((p, i) => (
        <Tooltip key={p.id}>
          <TooltipTrigger asChild>
            <a
              href={p.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ animationDelay: `${i * 50}ms` }}
              className="card-in inline-flex items-center justify-center w-9 h-9 rounded-xl
                bg-white/20 border border-white/30 backdrop-blur-sm
                transition-all duration-200 hover:bg-white/35 hover:border-white/60
                hover:-translate-y-0.5 hover:shadow-lg active:scale-90"
            >
              <Image 
                src={p.faviconUrl} 
                alt={p.label} 
                width={18} 
                height={18}
                className="rounded object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }} 
              />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{p.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
