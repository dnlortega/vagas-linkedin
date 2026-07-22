export function VagaCardSkeleton({ index = 0, vista = 'grade' }) {
  if (vista === 'lista') {
    return (
      <div style={{ animationDelay: `${index * 30}ms` }} className="card-in">
        <div className="flex items-center gap-3 bg-white rounded-[14px] border border-slate-100 px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="h-11 w-11 rounded-full shimmer flex-shrink-0 ml-2" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-1"><div className="h-4 w-16 rounded-md shimmer" /><div className="h-4 w-10 rounded-md shimmer" /></div>
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="h-3 w-1/2 rounded shimmer" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ animationDelay: `${index * 60}ms` }} className="card-in h-full">
      <div className="h-full flex flex-col bg-white rounded-[14px] border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="h-[3px] w-full shimmer" />
        <div className="px-5 pt-5 pb-3 flex gap-3.5 items-start">
          <div className="h-12 w-12 rounded-full shrink-0 shimmer" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-2/3 rounded shimmer" />
            <div className="h-5 w-20 rounded-lg shimmer" />
          </div>
        </div>
        <div className="px-5 pb-4 flex-1 space-y-1.5">
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-4/5 rounded shimmer" />
        </div>
        <div className="px-5 pb-4 space-y-2">
          <div className="h-3.5 w-3/5 rounded shimmer" />
          <div className="h-3.5 w-2/5 rounded shimmer" />
          <div className="flex gap-1.5 mt-1">
            <div className="h-6 w-16 rounded-lg shimmer" />
            <div className="h-6 w-20 rounded-lg shimmer" />
          </div>
        </div>
        <div className="px-5 pb-5"><div className="h-9 w-full rounded-xl shimmer" /></div>
      </div>
    </div>
  );
}
