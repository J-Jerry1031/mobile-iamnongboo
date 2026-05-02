export function ProductImage({ src, name, big = false }: { src: string; name: string; big?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-[#f1ead9] ${big ? 'aspect-square' : 'aspect-square'}`}>
      <img src={src} alt={name} className="h-full w-full object-cover" />
    </div>
  );
}
