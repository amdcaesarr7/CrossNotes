import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, Mail, Instagram, Phone, Send } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMotion } from '@/hooks/useMotion';

const CONTACT_INFO = {
  instagram: 'caesar.anwar',
  email: 'caesar.anwarr791@gmail.com',
  phone: '7559485046',
};

export default function FeedbackButton() {
  const { isDark, prefersReducedMotion } = useTheme();
  const { getVariants } = useMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = () => {
    if (feedbackText.trim()) {
      // Simulate submission
      setSubmitted(true);
      setTimeout(() => {
        setFeedbackText('');
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
    }
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${CONTACT_INFO.email}?subject=CrossNotes Feedback`;
  };

  const handleInstagramClick = () => {
    window.open(`https://instagram.com/${CONTACT_INFO.instagram}`, '_blank');
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${CONTACT_INFO.phone}`;
  };

  return (
    <>
      {/* Floating Feedback Button — claymorphic fixed position */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{
          background: 'var(--primary)',
          color: '#fff',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), inset -2px -2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        whileTap={!prefersReducedMotion ? { scale: 0.85, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15), inset -1px -1px 2px rgba(0, 0, 0, 0.1)' } : {}}
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
            className="relative w-full md:w-96 flex flex-col gap-5 max-h-[80vh] overflow-y-auto rounded-2xl"
            style={{
              background: isDark ? 'var(--bg-card)' : '#ffffff',
              border: `2px solid ${isDark ? 'var(--divider)' : 'var(--divider)'}`,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), inset -2px -2px 6px rgba(255, 255, 255, 0.15)',
              padding: '24px',
            }}
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
                className="p-2 rounded-lg"
                style={{ background: 'var(--bg-card-2)' }}
                whileTap={!prefersReducedMotion ? { scale: 0.88 } : {}}
                aria-label="Close feedback form"
              >
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            </div>

            {/* Feedback Textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                Your Feedback
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think, suggest features, or report issues..."
                className="w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--bg-card-2)',
                  color: 'var(--text)',
                  borderColor: 'var(--divider)',
                  focusRingColor: 'var(--primary)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  minHeight: '120px',
                }}
                disabled={submitted}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmitFeedback}
              disabled={!feedbackText.trim() || submitted}
              className="clay-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: submitted ? 'var(--green)' : 'var(--primary)',
                color: '#fff',
                boxShadow: submitted ? 'none' : 'var(--shadow-btn)',
              }}
              whileTap={!prefersReducedMotion && !submitted ? { scale: 0.95 } : {}}
            >
              {submitted ? (
                <>✓ Thank you!</>
              ) : (
                <>
                  <Send size={16} /> Submit Feedback
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="h-px" style={{ background: 'var(--divider)' }} />

            {/* Contact Methods Title */}
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              Or reach out directly:
            </p>

            {/* Contact Action Buttons */}
            <div className="flex flex-col gap-2">
              {/* Email Button */}
              <motion.button
                onClick={handleEmailClick}
                className="w-full p-3 rounded-lg flex items-center gap-3 font-semibold transition-all"
                style={{
                  background: isDark ? 'var(--bg-card-2)' : '#f0f2f5',
                  color: 'var(--text)',
                  border: '1px solid var(--divider)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), inset -1px -1px 2px rgba(255, 255, 255, 0.1)',
                }}
                whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
                transition={!prefersReducedMotion ? { duration: 0.1 } : {}}
              >
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <div className="flex-1 text-left">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Email
                  </div>
                  <div className="text-sm font-bold">{CONTACT_INFO.email}</div>
                </div>
              </motion.button>

              {/* Instagram Button */}
              <motion.button
                onClick={handleInstagramClick}
                className="w-full p-3 rounded-lg flex items-center gap-3 font-semibold transition-all"
                style={{
                  background: isDark ? 'var(--bg-card-2)' : '#f0f2f5',
                  color: 'var(--text)',
                  border: '1px solid var(--divider)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), inset -1px -1px 2px rgba(255, 255, 255, 0.1)',
                }}
                whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
                transition={!prefersReducedMotion ? { duration: 0.1 } : {}}
              >
                <Instagram size={18} style={{ color: '#E4405F' }} />
                <div className="flex-1 text-left">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Instagram
                  </div>
                  <div className="text-sm font-bold">@{CONTACT_INFO.instagram}</div>
                </div>
              </motion.button>

              {/* Phone Button */}
              <motion.button
                onClick={handlePhoneClick}
                className="w-full p-3 rounded-lg flex items-center gap-3 font-semibold transition-all"
                style={{
                  background: isDark ? 'var(--bg-card-2)' : '#f0f2f5',
                  color: 'var(--text)',
                  border: '1px solid var(--divider)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), inset -1px -1px 2px rgba(255, 255, 255, 0.1)',
                }}
                whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
                transition={!prefersReducedMotion ? { duration: 0.1 } : {}}
              >
                <Phone size={18} style={{ color: 'var(--gold)' }} />
                <div className="flex-1 text-left">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Phone
                  </div>
                  <div className="text-sm font-bold">+91 {CONTACT_INFO.phone}</div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
