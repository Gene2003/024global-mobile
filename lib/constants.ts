/** The 47 counties of Kenya, alphabetically sorted. */
export const KENYA_COUNTIES: string[] = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a",
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
].sort((a, b) => a.localeCompare(b));

/** Time-of-day greeting, e.g. "Good morning". */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Order fee model. */
export const DELIVERY_FEE = 150; // flat KES delivery fee
export const PLATFORM_FEE_RATE = 0.05; // 5% platform fee

export function orderFees(subtotal: number) {
  const platform = Math.round(subtotal * PLATFORM_FEE_RATE);
  const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
  return { subtotal, delivery, platform, total: subtotal + delivery + platform };
}

/** Units a farmer can list produce in. */
export const PRODUCE_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'tonnes', label: 'Tonnes' },
  { value: 'bags', label: 'Bags' },
  { value: 'litres', label: 'Litres' },
  { value: 'heads', label: 'Heads of livestock' },
];

export const QUALITY_GRADES = ['Grade 1 (Premium)', 'Grade 2 (Standard)', 'Grade 3 (Economy)'];
