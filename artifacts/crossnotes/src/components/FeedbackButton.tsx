import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, Copy, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMotion } from '@/hooks/useMotion';

const CONTACT_INFO = {
  instagram: '@caesar.anwar',
  email: 'caesar.anwarr791@gmail.com',
  phone: '7559485046',
};

export default function FeedbackButton() {
  const { isDark, prefersReducedMotion } = useTheme();
  const { getVariants } = useMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      {/* Floating Feedback Button — claymorphic fixed position */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 group"
        style={{
          background: 'var(--primary)',
          color: '#fff',
          boxShadow: 'var(--shadow-btn)',
        }}
        whileTap={!prefersReducedMotion ? { scale: 0.85 } : {}}
        whileHover={!prefersReducedMotion ? { scale: 1.08 } : {}}
        transition={!prefersReducedMotion ? { duration: 0.15 } : {}}
        title="Send feedback and suggestions"
        aria-label="Open feedback form"
      >
        <motion.div
          animate={!prefersReducedMotion ? { rotate: [0, -5, 5, 0] } : {}}
          transition={!prefersReducedMotion ? { duration: 3, repeat: Infinity } : {}}
        >
          <MessageSquare size={24} strokeWidth={2} />
        </motion.div>
      </motion.button>

      {/* Feedback Modal — backdrop + card */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          initial={!prefersReducedMotion ? { opacity: 0 } : {}}
          animate={!prefersReducedMotion ? { opacity: 1 } : {}}
          transition={!prefersReducedMotion ? { duration: 0.2 } : {}}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative clay-card p-6 w-full md:w-96 flex flex-col gap-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={!prefersReducedMotion ? { opacity: 0, y: 50 } : {}}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            exit={!prefersReducedMotion ? { opacity: 0, y: 50 } : {}}
            transition={!prefersReducedMotion ? { duration: 0.3, type: 'spring', damping: 25 } : {}}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>
                Send Feedback
              </h2>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-opacity-50"
                style={{ background: 'var(--bg-card-2)' }}
                whileTap={!prefersReducedMotion ? { scale: 0.88 } : {}}
              >
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            </div>

            {/* Description */}
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Have a suggestion or found a bug? We'd love to hear from you! Reach out using any of these methods:
            </p>

            {/* Contact Methods */}
            <div className="flex flex-col gap-3">
              {/* Email */}
              <div className="clay-card p-4 flex items-center gap-3 group cursor-pointer hover:shadow-card-hover transition-shadow">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                >
                  📧
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    Email
                  </p>
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {CONTACT_INFO.email}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleCopy(CONTACT_INFO.email, 'email')}
                  whileTap={!prefersReducedMotion ? { scale: 0.85 } : {}}
                  className="p-2 rounded-lg"
                  style={{ background: copied === 'email' ? 'var(--green-light)' : 'var(--bg-card-2)' }}
                >
                  {copied === 'email' ? (
                    <Check size={16} style={{ color: 'var(--green)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </motion.button>
              </div>

              {/* Instagram */}
              <div className="clay-card p-4 flex items-center gap-3 group cursor-pointer hover:shadow-card-hover transition-shadow">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: '#f0f2f5', color: '#E4405F' }}
                >
                  📱
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    Instagram
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#E4405F' }}
                  >
                    {CONTACT_INFO.instagram}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleCopy(CONTACT_INFO.instagram, 'instagram')}
                  whileTap={!prefersReducedMotion ? { scale: 0.85 } : {}}
                  className="p-2 rounded-lg"
                  style={{ background: copied === 'instagram' ? 'var(--green-light)' : 'var(--bg-card-2)' }}
                >
                  {copied === 'instagram' ? (
                    <Check size={16} style={{ color: 'var(--green)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </motion.button>
              </div>

              {/* Phone */}
              <div className="clay-card p-4 flex items-center gap-3 group cursor-pointer hover:shadow-card-hover transition-shadow">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: 'var(--gold-light)', color: 'var(--gold)' }}
                >
                  📞
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    Phone
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text)' }}
                  >
                    {CONTACT_INFO.phone}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleCopy(CONTACT_INFO.phone, 'phone')}
                  whileTap={!prefersReducedMotion ? { scale: 0.85 } : {}}
                  className="p-2 rounded-lg"
                  style={{ background: copied === 'phone' ? 'var(--green-light)' : 'var(--bg-card-2)' }}
                >
                  {copied === 'phone' ? (
                    <Check size={16} style={{ color: 'var(--green)' }} />
                  ) : (
                    <Copy size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Footer CTA */}
            <motion.button
              onClick={() => setIsOpen(false)}
              className="clay-btn w-full py-3 text-sm font-bold text-white"
              style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-btn)' }}
              whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
