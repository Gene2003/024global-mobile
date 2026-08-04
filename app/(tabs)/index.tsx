import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import { useThemedStyles } from '../../components/ui';

/* ── exact website images (assets/home) ── */
const img1 = require('../../assets/home/1.jpg');
const img2 = require('../../assets/home/2.jpg');
const img3 = require('../../assets/home/3.jpg');
const img4 = require('../../assets/home/4.jpg');
const img5 = require('../../assets/home/5.jpg');
const img6 = require('../../assets/home/6.jpg');
const img7 = require('../../assets/home/7.jpg');
const img8 = require('../../assets/home/8.jpg');
const img9 = require('../../assets/home/9.jpg');
const logo = require('../../assets/home/logo.png');

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W;

/* ── data (mirrors website HeroWithCTA + About + Feedback) ── */
const banners = [
  { img: img5, badge: 'Best Deals Today', title: 'Fresh Farm Produce', subtitle: 'Direct from farmers to your table — guaranteed freshness', cta: 'Shop Now', to: '/products' },
  { img: img1, badge: 'New Vendors', title: 'Start Selling Online', subtitle: 'Join thousands of vendors selling fresh produce 24/7', cta: 'Join as Vendor', to: '/register' },
  { img: img7, badge: 'Earn Commissions', title: 'Become an Affiliate', subtitle: 'Refer vendors and earn 50% registration commission', cta: 'Learn More', to: '/register' },
];

const categoryLinks = [
  { name: 'Vegetables', img: require('../../assets/home/products/carrots.jpg') },
  { name: 'Tomatoes', img: require('../../assets/home/products/tomato.jpg') },
  { name: 'Fruits', img: require('../../assets/home/products/strawberry.jpg') },
  { name: 'Root Crops', img: require('../../assets/home/products/potato.jpg') },
  { name: 'Herbs', img: require('../../assets/home/products/rosemary.jpg') },
  { name: 'Legumes', img: require('../../assets/home/products/beans.jpg') },
  { name: 'Leafy Greens', img: require('../../assets/home/products/sukumawiki.jpg') },
  { name: 'Spices', img: require('../../assets/home/products/ginger.jpg') },
];

const featuredProducts = [
  { img: require('../../assets/home/products/tomato.jpg'), name: 'Fresh Tomatoes', badge: 'Fresh' },
  { img: require('../../assets/home/products/watermelon.jpg'), name: 'Sweet Watermelon', badge: 'Sweet' },
  { img: require('../../assets/home/products/sukumawiki.jpg'), name: 'Sukuma Wiki (Kales)', badge: 'Leafy' },
  { img: require('../../assets/home/products/potato.jpg'), name: 'Irish Potatoes', badge: 'Local' },
  { img: require('../../assets/home/products/beans.jpg'), name: 'Beans', badge: 'Protein' },
  { img: require('../../assets/home/products/carrots.jpg'), name: 'Fresh Carrots', badge: 'Crunchy' },
  { img: require('../../assets/home/products/ginger.jpg'), name: 'Fresh Ginger', badge: 'Spice' },
  { img: require('../../assets/home/products/garlic.jpg'), name: 'Garlic', badge: 'Organic' },
  { img: require('../../assets/home/products/managu.jpg'), name: 'Managu', badge: 'Nutritious' },
  { img: require('../../assets/home/products/strawberry.jpg'), name: 'Strawberries', badge: 'Fruit' },
  { img: require('../../assets/home/products/capsicum.jpg'), name: 'Green Capsicum', badge: 'Crisp' },
  { img: require('../../assets/home/products/sweetpotato.jpg'), name: 'Sweet Potatoes', badge: 'Energy' },
];

const steps = [
  { num: '01', title: 'Register', body: 'Sign up as a farmer, wholesaler, retailer, or affiliate in minutes.', img: img4 },
  { num: '02', title: 'List or Browse', body: 'Vendors list products with photos and prices. Buyers browse fresh farm produce and goods.', img: img6 },
  { num: '03', title: 'Pay & Earn', body: 'Buyers pay securely via M-Pesa. Vendors earn. Affiliates get commissions.', img: img9 },
];

const ecosystem = [
  { img: img5, title: 'Farmers', desc: 'List your crops, set your price, reach buyers across Kenya and beyond.' },
  { img: img1, title: 'Vendors', desc: 'Grow your market stall into a digital store accessible 24/7.' },
  { img: img9, title: 'Buyers', desc: 'Order fresh produce and goods delivered straight to your door.' },
  { img: img4, title: 'Affiliates', desc: 'Refer vendors, earn 50% registration commission plus sales commissions.' },
];

const adBanners = [
  { img: img7, label: 'Fresh From the Farm', sub: 'Order direct, save more' },
  { img: img8, label: 'Meet Our Top Farmers', sub: '5,000+ farmers ready to sell' },
  { img: img6, label: 'Become a Vendor Today', sub: 'Easy setup, start in minutes' },
];

const testimonials = [
  { img: img7, name: 'Grace M.', role: 'Maize Farmer, Nakuru', quote: 'I used to sell at the market at 6am. Now orders come to my phone while I\'m still in the field.' },
  { img: img8, name: 'Amina W.', role: 'Smallholder Farmer, Kisumu', quote: '024 Global Connect helped me find buyers who pay fair prices. My income doubled this season.' },
  { img: img6, name: 'David K.', role: 'Horticulture Vendor, Nairobi', quote: 'I list my mangoes, track stock, and get paid — all from one platform. It changed everything.' },
];

const stats = [
  { value: '5,000+', label: 'Farmers Connected' },
  { value: '200+', label: 'Active Vendors' },
  { value: '50,000+', label: 'Products Listed' },
  { value: '10+', label: 'Counties Served' },
];

const benefits = [
  'Receive instant SMS & email order notifications',
  'Accept M-Pesa payments securely via Paystack',
  'Track your stock and sales in real time',
  'Earn affiliate commissions by referring vendors',
];

function Stars() {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Text key={i} style={{ color: theme.colors.gold, fontSize: 16 }}>★</Text>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useStyles();
  const [current, setCurrent] = useState(0);
  const heroRef = useRef<ScrollView>(null);

  /* auto-advance the hero carousel */
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrent((p) => {
        const next = (p + 1) % banners.length;
        heroRef.current?.scrollTo({ x: next * HERO_W, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_W);
    if (idx !== current) setCurrent(idx);
  };

  const go = (route: string) => router.push(route as any);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
        <View>
          <Text style={styles.logoText}>024 GLOBAL CONNECT</Text>
          <Text style={styles.tagline}>Your Agricultural Marketplace</Text>
        </View>
      </View>

      {/* ── HERO CAROUSEL ── */}
      <View style={styles.heroWrap}>
        <ScrollView
          ref={heroRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onHeroScroll}
        >
          {banners.map((b, i) => (
            <ImageBackground key={i} source={b.img} style={styles.heroSlide} imageStyle={styles.heroImg}>
              <View style={styles.heroOverlay}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{b.badge.toUpperCase()}</Text>
                </View>
                <Text style={styles.heroTitle}>{b.title}</Text>
                <Text style={styles.heroSub}>{b.subtitle}</Text>
                <TouchableOpacity style={styles.heroBtn} onPress={() => go(b.to)}>
                  <Text style={styles.heroBtnText}>{b.cta}</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          ))}
        </ScrollView>
        {/* dots */}
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* ── CATEGORY ICONS ROW ── */}
      <View style={styles.card}>
        <View style={styles.catGrid}>
          {categoryLinks.map((c) => (
            <TouchableOpacity key={c.name} style={styles.catItem} onPress={() => go('/products')}>
              <View style={styles.catCircle}>
                <Image source={c.img} style={styles.catImg} resizeMode="cover" />
              </View>
              <Text style={styles.catName}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── STATS BAR ── */}
      <View style={styles.statsBar}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── FEATURED PRODUCTS ── */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>🌿 Featured Products</Text>
          <TouchableOpacity onPress={() => go('/products')}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.prodGrid}>
          {featuredProducts.map((p) => (
            <TouchableOpacity key={p.name} style={styles.prodCard} onPress={() => go('/products')}>
              <View style={styles.prodImgWrap}>
                <Image source={p.img} style={styles.prodImg} resizeMode="cover" />
                <View style={styles.prodBadge}>
                  <Text style={styles.prodBadgeText}>{p.badge}</Text>
                </View>
              </View>
              <View style={styles.prodBody}>
                <Text style={styles.prodName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.prodTap}>Tap to browse →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.eyebrow}>SIMPLE & FAST</Text>
        <Text style={styles.bigTitle}>How It Works</Text>
        {steps.map((s) => (
          <View key={s.num} style={styles.stepCard}>
            <View style={styles.stepImgWrap}>
              <Image source={s.img} style={styles.stepImg} resizeMode="cover" />
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP {s.num}</Text>
              </View>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── OUR ECOSYSTEM ── */}
      <View style={styles.section}>
        <Text style={styles.eyebrow}>WHO WE SERVE</Text>
        <Text style={styles.bigTitle}>Built for Everyone in the Value Chain</Text>
        <View style={styles.ecoGrid}>
          {ecosystem.map((e) => (
            <View key={e.title} style={styles.ecoCard}>
              <Image source={e.img} style={styles.ecoImg} resizeMode="cover" />
              <View style={{ padding: 14 }}>
                <Text style={styles.ecoTitle}>{e.title}</Text>
                <Text style={styles.ecoDesc}>{e.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── MARKET VENDOR FEATURE ── */}
      <ImageBackground source={img2} style={styles.feature} imageStyle={{}}>
        <View style={styles.featureOverlay}>
          <Text style={styles.featureTitle}>From the Market Stall to the Digital Shelf</Text>
          <Text style={styles.featureSub}>
            Whether you sell meat, produce, or packaged goods — your store is open to the whole country, 24 hours a day.
          </Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => go('/register')}>
            <Text style={styles.heroBtnText}>Start Selling Today</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* ── DIGITAL AGRI FEATURE ── */}
      <View style={[styles.section, styles.agriSection]}>
        <Text style={styles.eyebrow}>TECHNOLOGY + AGRICULTURE</Text>
        <Text style={styles.bigTitle}>A Phone Is All You Need to Grow Your Business</Text>
        <Text style={styles.agriBody}>
          Our platform is built for African farmers and vendors. List products, receive orders, track stock, and get
          paid — all from your mobile phone. No laptop required.
        </Text>
        {benefits.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={14} color={c.onPrimary} />
            </View>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
        <View style={styles.agriImgGrid}>
          {[img4, img3, img6, img9].map((im, i) => (
            <Image key={i} source={im} style={styles.agriImg} resizeMode="cover" />
          ))}
        </View>
      </View>

      {/* ── BANNER AD ROW ── */}
      <View style={styles.section}>
        {adBanners.map((b) => (
          <TouchableOpacity key={b.label} onPress={() => go('/products')} activeOpacity={0.9}>
            <ImageBackground source={b.img} style={styles.adBanner} imageStyle={styles.adImg}>
              <View style={styles.adOverlay}>
                <Text style={styles.adLabel}>{b.label}</Text>
                <Text style={styles.adSub}>{b.sub}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TESTIMONIALS ── */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.eyebrow}>TESTIMONIALS</Text>
        <Text style={styles.bigTitle}>What Our Community Says</Text>
        {testimonials.map((t) => (
          <View key={t.name} style={styles.testCard}>
            <Stars />
            <Text style={styles.testQuote}>&quot;{t.quote}&quot;</Text>
            <View style={styles.testUser}>
              <Image source={t.img} style={styles.testAvatar} resizeMode="cover" />
              <View>
                <Text style={styles.testName}>{t.name}</Text>
                <Text style={styles.testRole}>{t.role}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── JOIN CTA ── */}
      <ImageBackground source={img5} style={styles.cta} imageStyle={{}}>
        <View style={styles.ctaOverlay}>
          <Text style={styles.ctaTitle}>Ready to Transform Your Business?</Text>
          <Text style={styles.ctaSub}>
            Join thousands of farmers, vendors, and buyers already using 024 Global Connect to grow their income.
          </Text>
          <TouchableOpacity style={styles.ctaBtnLight} onPress={() => go('/products')}>
            <Text style={styles.ctaBtnLightText}>Browse Marketplace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaBtnOutline} onPress={() => go('/register')}>
            <Text style={styles.ctaBtnOutlineText}>Join Free</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>024 GLOBAL CONNECT</Text>
        <Text style={styles.footerText}>© 2026 024 Global Connect. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const useStyles = () =>
  useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.background },

    /* header */
    header: { backgroundColor: t.colors.headerBg, paddingTop: 56, paddingBottom: 18, paddingHorizontal: 18, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    headerLogo: { width: 40, height: 40, borderRadius: t.radius.sm, backgroundColor: t.colors.onHeader },
    logoText: { color: t.colors.onHeader, fontSize: 18, fontWeight: '800' as const, letterSpacing: 0.5 },
    tagline: { color: t.colors.onHeaderMuted, fontSize: 12, marginTop: 2 },

    /* hero */
    heroWrap: { position: 'relative' as const },
    heroSlide: { width: HERO_W, height: 300, justifyContent: 'flex-end' as const },
    heroImg: {},
    heroOverlay: { padding: 24, paddingBottom: 34, backgroundColor: 'rgba(0,0,0,0.35)', flex: 1, justifyContent: 'flex-end' as const },
    badge: { alignSelf: 'flex-start' as const, backgroundColor: t.colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: t.radius.pill, marginBottom: 10 },
    badgeText: { color: t.colors.onPrimary, fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.5 },
    heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' as const, marginBottom: 6 },
    heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 16, lineHeight: 20 },
    heroBtn: { alignSelf: 'flex-start' as const, backgroundColor: t.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: t.radius.md },
    heroBtnText: { color: t.colors.onPrimary, fontWeight: '700' as const, fontSize: 14 },
    dots: { position: 'absolute' as const, bottom: 12, alignSelf: 'center' as const, flexDirection: 'row' as const, gap: 6 },
    dot: { width: 8, height: 8, borderRadius: t.radius.pill, backgroundColor: 'rgba(255,255,255,0.6)' },
    dotActive: { width: 22, backgroundColor: t.colors.primary },

    /* generic card / sections */
    card: { backgroundColor: t.colors.surface, margin: 12, borderRadius: t.radius.lg, padding: 14, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
    section: { paddingHorizontal: 16, paddingVertical: 22 },
    sectionAlt: { backgroundColor: t.colors.surfaceAlt },
    sectionHead: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 14 },
    sectionTitle: { fontSize: 20, fontWeight: '800' as const, color: t.colors.text },
    viewAll: { color: t.colors.primary, fontWeight: '700' as const, fontSize: 13 },
    eyebrow: { color: t.colors.primary, fontWeight: '700' as const, fontSize: 12, letterSpacing: 1.5, textAlign: 'center' as const },
    bigTitle: { fontSize: 24, fontWeight: '800' as const, color: t.colors.text, textAlign: 'center' as const, marginTop: 6, marginBottom: 18 },

    /* category icons */
    catGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
    catItem: { width: '25%' as const, alignItems: 'center' as const, marginVertical: 8 },
    catCircle: { width: 58, height: 58, borderRadius: t.radius.pill, overflow: 'hidden' as const, backgroundColor: t.colors.surfaceAlt, borderWidth: 2, borderColor: 'transparent' },
    catImg: { width: '100%' as const, height: '100%' as const },
    catName: { fontSize: 11, fontWeight: '600' as const, color: t.colors.textMuted, marginTop: 6, textAlign: 'center' as const },

    /* stats */
    statsBar: { backgroundColor: t.colors.headerBg, flexDirection: 'row' as const, flexWrap: 'wrap' as const, paddingVertical: 22 },
    statItem: { width: '50%' as const, alignItems: 'center' as const, paddingVertical: 12 },
    statValue: { color: t.colors.onHeader, fontSize: 30, fontWeight: '800' as const },
    statLabel: { color: t.colors.onHeaderMuted, fontSize: 12, marginTop: 4, fontWeight: '500' as const },

    /* featured products */
    prodGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const },
    prodCard: { width: '48%' as const, backgroundColor: t.colors.surface, borderRadius: t.radius.md, marginBottom: 14, overflow: 'hidden' as const, borderWidth: 1, borderColor: t.colors.border, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 6, elevation: 1 },
    prodImgWrap: { height: 130, position: 'relative' as const },
    prodImg: { width: '100%' as const, height: '100%' as const },
    prodBadge: { position: 'absolute' as const, top: 8, left: 8, backgroundColor: t.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: t.radius.pill },
    prodBadgeText: { color: t.colors.onPrimary, fontSize: 10, fontWeight: '700' as const },
    prodBody: { padding: 10 },
    prodName: { fontSize: 13, fontWeight: '700' as const, color: t.colors.text },
    prodTap: { fontSize: 11, color: t.colors.primary, marginTop: 2 },

    /* how it works */
    stepCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, overflow: 'hidden' as const, marginBottom: 16, borderWidth: 1, borderColor: t.colors.border },
    stepImgWrap: { height: 180, position: 'relative' as const },
    stepImg: { width: '100%' as const, height: '100%' as const },
    stepBadge: { position: 'absolute' as const, top: 14, left: 14, backgroundColor: t.colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: t.radius.pill },
    stepBadgeText: { color: t.colors.onPrimary, fontSize: 11, fontWeight: '700' as const, letterSpacing: 1 },
    stepTitle: { fontSize: 18, fontWeight: '700' as const, color: t.colors.text, marginBottom: 6 },
    stepBody: { fontSize: 14, color: t.colors.textMuted, lineHeight: 20 },

    /* ecosystem */
    ecoGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const },
    ecoCard: { width: '48%' as const, backgroundColor: t.colors.surface, borderRadius: t.radius.lg, overflow: 'hidden' as const, marginBottom: 14, shadowColor: t.colors.shadow, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
    ecoImg: { width: '100%' as const, height: 120 },
    ecoTitle: { fontSize: 15, fontWeight: '700' as const, color: t.colors.text, marginBottom: 4 },
    ecoDesc: { fontSize: 12, color: t.colors.textMuted, lineHeight: 17 },

    /* market vendor feature */
    feature: { height: 360, justifyContent: 'center' as const },
    featureOverlay: { flex: 1, justifyContent: 'center' as const, padding: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
    featureTitle: { color: '#fff', fontSize: 26, fontWeight: '800' as const, marginBottom: 12, lineHeight: 32 },
    featureSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 20, lineHeight: 22 },

    /* digital agri */
    agriSection: { backgroundColor: t.colors.surfaceAlt },
    agriBody: { fontSize: 14, color: t.colors.textMuted, lineHeight: 21, marginBottom: 16 },
    benefitRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10, marginBottom: 12 },
    check: { width: 20, height: 20, borderRadius: t.radius.pill, backgroundColor: t.colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 1 },
    benefitText: { flex: 1, fontSize: 14, color: t.colors.textMuted, lineHeight: 20 },
    agriImgGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const, marginTop: 8 },
    agriImg: { width: '48%' as const, height: 130, borderRadius: t.radius.lg, marginBottom: 12 },

    /* ad banners */
    adBanner: { height: 130, borderRadius: t.radius.lg, overflow: 'hidden' as const, marginBottom: 12, justifyContent: 'flex-end' as const },
    adImg: { borderRadius: t.radius.lg },
    adOverlay: { padding: 14, backgroundColor: 'rgba(0,0,0,0.35)' },
    adLabel: { color: '#fff', fontWeight: '700' as const, fontSize: 15 },
    adSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

    /* testimonials */
    testCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: t.colors.border },
    testQuote: { fontSize: 14, color: t.colors.textMuted, fontStyle: 'italic' as const, lineHeight: 21, marginVertical: 12 },
    testUser: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    testAvatar: { width: 46, height: 46, borderRadius: t.radius.pill, borderWidth: 2, borderColor: t.colors.border },
    testName: { fontSize: 14, fontWeight: '700' as const, color: t.colors.text },
    testRole: { fontSize: 12, color: t.colors.primary, fontWeight: '500' as const },

    /* join cta */
    cta: { minHeight: 320, justifyContent: 'center' as const },
    ctaOverlay: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 28, backgroundColor: 'rgba(0,0,0,0.55)' },
    ctaTitle: { color: '#fff', fontSize: 26, fontWeight: '800' as const, textAlign: 'center' as const, marginBottom: 12, lineHeight: 32 },
    ctaSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center' as const, marginBottom: 22, lineHeight: 22 },
    ctaBtnLight: { backgroundColor: t.colors.surface, paddingVertical: 14, paddingHorizontal: 32, borderRadius: t.radius.md, marginBottom: 12, width: '100%' as const, alignItems: 'center' as const },
    ctaBtnLightText: { color: t.colors.primary, fontWeight: '700' as const, fontSize: 15 },
    ctaBtnOutline: { backgroundColor: t.colors.primary, borderWidth: 2, borderColor: t.colors.primaryPressed, paddingVertical: 14, paddingHorizontal: 32, borderRadius: t.radius.md, width: '100%' as const, alignItems: 'center' as const },
    ctaBtnOutlineText: { color: t.colors.onPrimary, fontWeight: '700' as const, fontSize: 15 },

    /* footer */
    footer: { backgroundColor: t.colors.headerBg, padding: 24, alignItems: 'center' as const },
    footerBrand: { color: t.colors.onHeader, fontWeight: '800' as const, fontSize: 16, letterSpacing: 0.5, marginBottom: 8 },
    footerText: { color: t.colors.onHeaderMuted, fontSize: 12, textAlign: 'center' as const },
  }));
