export const loanStatusVisuals = {
  CURRENT: {
    color: '#7CC99B',
    badgeClassName: 'bg-[#7CC99B] text-[#173B29]',
    dotClassName: 'bg-[#7CC99B]',
  },
  PENDING: {
    color: '#26322C',
    badgeClassName: 'bg-[#26322C] text-white',
    dotClassName: 'bg-[#26322C]',
  },
  LATE: {
    color: '#F3D477',
    badgeClassName: 'bg-[#F3D477] text-[#4A3905]',
    dotClassName: 'bg-[#F3D477]',
  },
  EXPIRED: {
    color: '#E67C73',
    badgeClassName: 'bg-[#E67C73] text-[#4A201D]',
    dotClassName: 'bg-[#E67C73]',
  },
  PAID: {
    color: '#8EB8D8',
    badgeClassName: 'bg-[#8EB8D8] text-[#17354A]',
    dotClassName: 'bg-[#8EB8D8]',
  },
  WRITTEN_OFF: {
    color: '#D1D5D3',
    badgeClassName: 'bg-[#D1D5D3] text-[#343A36]',
    dotClassName: 'bg-[#D1D5D3]',
  },
} as const;

export function getLoanStatusBadgeClass(label: string) {
  const normalized = label.trim().toLowerCase();
  if (['al día', 'a tiempo', 'activo'].includes(normalized)) {
    return loanStatusVisuals.CURRENT.badgeClassName;
  }
  if (['pendiente', 'parcial'].includes(normalized)) {
    return loanStatusVisuals.PENDING.badgeClassName;
  }
  if (normalized === 'atrasado') return loanStatusVisuals.LATE.badgeClassName;
  if (normalized === 'vencido') return loanStatusVisuals.EXPIRED.badgeClassName;
  if (['pagado', 'terminado'].includes(normalized)) {
    return loanStatusVisuals.PAID.badgeClassName;
  }
  return loanStatusVisuals.WRITTEN_OFF.badgeClassName;
}
