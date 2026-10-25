import type { TypeName } from '@/domain/models';
import { TYPE_COLORS } from '@/domain/typeChart';
import { useT } from '@/i18n';
import { TypeIcon } from './TypeIcon';

interface Props {
  type: TypeName;
  size?: 'sm' | 'md';
  className?: string;
}

/** Badge de type : icône + nom traduit, couleurs à contraste AA. */
export function TypeBadge({ type, size = 'sm', className = '' }: Props) {
  const t = useT();
  const c = TYPE_COLORS[type];
  const sizing = size === 'sm' ? 'gap-1 px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px]' : 'gap-1.5 px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-semibold tracking-wide uppercase shadow-sm ${sizing} ${className}`}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <TypeIcon type={type} className={size === 'sm' ? 'size-3' : 'size-4'} />
      {t(`types.${type}`)}
    </span>
  );
}
