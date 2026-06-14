export function formatPrice(
  amount: number | null | undefined, 
  currency: 'EUR' | 'USD' | 'FCFA' = 'EUR', 
  rawOnlySymbol = false
): string {
  if (amount === null || amount === undefined) {
    if (currency === 'EUR') return '0 €';
    if (currency === 'USD') return '$0';
    return '0 FCFA';
  }
  
  if (rawOnlySymbol) {
    if (currency === 'USD') return `$${amount.toLocaleString('en-US')}`;
    if (currency === 'FCFA') return `${amount.toLocaleString('fr-FR')} FCFA`;
    return `${amount.toLocaleString('fr-FR')} €`;
  }

  if (currency === 'USD') {
    const usdAmount = amount * 1.08;
    return `$${Math.round(usdAmount).toLocaleString('en-US')}`;
  } else if (currency === 'FCFA') {
    const fcfaAmount = amount * 655.957;
    return `${Math.round(fcfaAmount).toLocaleString('fr-FR')} FCFA`;
  } else {
    return `${amount.toLocaleString('fr-FR')} €`;
  }
}
