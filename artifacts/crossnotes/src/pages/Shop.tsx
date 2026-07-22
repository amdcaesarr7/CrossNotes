import { useState } from 'react';
import { Coins, Sparkles, Zap, Loader2, Tag, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, buyPotion, usePotion, redeemNicknameTag, sanitizeNickname, MAX_STREAK_FREEZES } from '@/hooks/useFirestore';
import { POTIONS, getPotion } from '@/data/potions';
import { sfx } from '@/lib/sfx';
import { fireConfetti } from '@/lib/confetti';
import PotionIcon from '@/components/PotionIcon';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

const SHOP_TAGLINES = [
  "Ethically dubious. Academically effective.",
  "No refunds. This is a study app, not customer service.",
  "Side effects may include actually passing your boards.",
  "We accept coins, not excuses.",
];

function timeLeft(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const mins = Math.ceil(ms / 60000);
  return `${mins} min left`;
}

export default function Shop() {
  const { isDark } = useTheme();
  const { user, signInWithGoogle } = useAuth();
  const { profile, loading } = useUserProfile(user?.uid);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');

  const coins = profile?.coins ?? 0;
  const inventory = profile?.inventory ?? {};
  const nickname = profile?.nickname ?? null;
  const activeBoost = profile?.activeBoost;
  const boostActive = activeBoost && activeBoost.expiresAt.toDate().getTime() > Date.now();
  const activeBoostPotion = boostActive ? getPotion(activeBoost.potionId) : undefined;

  const ownedPotions = POTIONS.filter(p => (inventory[p.id] ?? 0) > 0);

  const handleBuy = async (potionId: string, cost: number) => {
    if (!user) { toast.error('Sign in first — the shop does not accept IOUs.'); return; }
    setBusyId(potionId);
    try {
      const result = await buyPotion(user.uid, potionId, cost);
      if (result.ok) {
        sfx.correct();
        toast.success(`Bought! ${result.coinsLeft} coins left.`);
      } else {
        sfx.wrong();
        toast.error("Not enough coins. Go earn some XP, then come back.");
      }
    } catch (err) { console.error(err); toast.error('Something broke. Try again?'); }
    finally { setBusyId(null); }
  };

  const handleUse = async (potionId: string) => {
    if (!user) return;
    const potion = getPotion(potionId);
    if (!potion || potion.kind === 'nickname_tag') return; // nickname flow has its own UI, see below
    setBusyId(potionId);
    try {
      const result = await usePotion(user.uid, potionId, {
        kind: potion.kind, multiplier: potion.multiplier, durationMin: potion.durationMin,
      });
      if (result.ok && result.kind === 'xp_boost') {
        sfx.levelUp();
        fireConfetti({ count: 90 });
        toast.success(`🧪 ${potion.name} active! ${potion.multiplier}x XP for ${potion.durationMin} min.`);
      } else if (result.ok && result.kind === 'streak_shield') {
        sfx.streakMilestone();
        toast.success(`🧊 +1 streak freeze banked (${result.streakFreezes}/${MAX_STREAK_FREEZES}).`);
      } else {
        toast.error("You don't actually own that one. Nice try.");
      }
    } catch (err) { console.error(err); toast.error('Something broke. Try again?'); }
    finally { setBusyId(null); }
  };

  const handleRedeemNickname = async () => {
    if (!user) return;
    const clean = sanitizeNickname(nicknameDraft);
    if (!clean) { toast.error('Type something first — blank flexes are not flexes.'); return; }
    setBusyId('nickname_tag');
    try {
      const result = await redeemNicknameTag(user.uid, clean);
      if (result.ok) {
        sfx.streakMilestone();
        fireConfetti({ count: 70 });
        toast.success(`🏷️ Now flexing as "${result.nickname}"`);
        setEditingNickname(false);
        setNicknameDraft('');
      } else if (result.reason === 'none_owned') {
        toast.error("You don't own a Nickname Tag. Buy one first.");
      } else {
        toast.error('Something broke. Try again?');
      }
    } catch (err) { console.error(err); toast.error('Something broke. Try again?'); }
    finally { setBusyId(null); }
  };

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Shop" backHref="/" />

      <main className="page-content">
        {!user ? (
          <div className="clay-card p-10 flex flex-col items-center text-center gap-4">
            <p className="text-5xl">🔐</p>
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>Sign in to shop</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Coins, potions, and questionable decisions await.</p>
            <button onClick={signInWithGoogle} className="clay-btn">Sign in with Google</button>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 size={30} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Coins balance */}
            <div className="clay-card p-4 flex items-center justify-between" style={{ background: 'var(--gold-light)', borderColor: 'var(--gold-border)' }}>
              <div className="flex items-center gap-2">
                <Coins size={22} style={{ color: 'var(--gold)' }} />
                <span className="font-display font-black text-2xl" style={{ color: 'var(--text)' }}>{coins}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>coins</span>
              </div>
              <p className="text-xs font-semibold text-right max-w-[45%]" style={{ color: 'var(--text-muted)' }}>
                {SHOP_TAGLINES[new Date().getDate() % SHOP_TAGLINES.length]}
              </p>
            </div>

            {nickname && (
              <div className="clay-card p-3 flex items-center gap-2" style={{ background: 'var(--bg-card-2)' }}>
                <Tag size={16} style={{ color: 'var(--gold)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Flexing as "{nickname}"</span>
              </div>
            )}

            {/* Active boost banner */}
            {boostActive && activeBoostPotion && (
              <div className="clay-card p-4 flex items-center gap-3" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary-border)' }}>
                <PotionIcon potion={activeBoostPotion} size={32} />
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeBoostPotion.name} is active</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {activeBoostPotion.multiplier}x XP · {timeLeft(activeBoost!.expiresAt.toDate())}
                  </p>
                </div>
                <Zap size={20} style={{ color: 'var(--gold)' }} />
              </div>
            )}

            {/* Inventory */}
            {ownedPotions.length > 0 && (
              <section>
                <h2 className="section-header mb-3">Your Inventory</h2>
                <div className="flex flex-col gap-2">
                  {ownedPotions.map(p => (
                    <div key={p.id} className="clay-card p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <PotionIcon potion={p} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{p.name} <span style={{ color: 'var(--text-muted)' }}>×{inventory[p.id]}</span></p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                        </div>
                        {p.kind === 'nickname_tag' ? (
                          <button
                            onClick={() => setEditingNickname(v => !v)}
                            className="clay-btn-ghost text-xs py-2 px-3 shrink-0"
                          >
                            {editingNickname ? 'Cancel' : 'Use'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUse(p.id)}
                            disabled={busyId === p.id || (!!boostActive && p.kind === 'xp_boost')}
                            className="clay-btn-ghost text-xs py-2 px-3 shrink-0"
                          >
                            {busyId === p.id ? '...' : 'Use'}
                          </button>
                        )}
                      </div>
                      {p.kind === 'nickname_tag' && editingNickname && (
                        <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--divider)' }}>
                          <input
                            autoFocus
                            value={nicknameDraft}
                            onChange={e => setNicknameDraft(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleRedeemNickname()}
                            placeholder="Type your flex..."
                            maxLength={18}
                            className="flex-1 text-sm px-3 py-2 rounded-full"
                            style={{ background: 'var(--bg-input)', border: '1.5px solid var(--divider)', color: 'var(--text)' }}
                          />
                          <button onClick={handleRedeemNickname} disabled={busyId === 'nickname_tag'} className="clay-btn-ghost p-2 shrink-0" aria-label="Confirm nickname">
                            <Check size={16} style={{ color: 'var(--green)' }} />
                          </button>
                          <button onClick={() => { setEditingNickname(false); setNicknameDraft(''); }} className="clay-btn-ghost p-2 shrink-0" aria-label="Cancel">
                            <X size={16} style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Shop catalog */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                <h2 className="section-header">Potion Shop</h2>
              </div>
              <div className="flex flex-col gap-3">
                {POTIONS.map(p => {
                  const canAfford = coins >= p.cost;
                  return (
                    <div key={p.id} className="clay-card p-4 flex items-center gap-3">
                      <PotionIcon potion={p} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
                        <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.tagline}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                      </div>
                      <button
                        onClick={() => handleBuy(p.id, p.cost)}
                        disabled={!canAfford || busyId === p.id}
                        className={canAfford ? 'clay-btn text-xs py-2 px-3 shrink-0' : 'clay-btn-ghost text-xs py-2 px-3 shrink-0 opacity-50'}
                      >
                        {busyId === p.id ? '...' : (
                          <span className="flex items-center gap-1">
                            <Coins size={13} /> {p.cost}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="text-xs text-center italic" style={{ color: 'var(--text-muted)' }}>
              Coins are earned automatically alongside XP — roughly 1 coin per 5 XP. No microtransactions, this isn't that kind of app.
            </p>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
