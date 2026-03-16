export type SupportFaq = {
  id: string;
  question: string;
  answer: string;
  category: 'getting_started' | 'payments_escrow' | 'trust_safety' | 'profile_account';
};

export type SupportChannel = {
  id: 'chat' | 'email';
  title: string;
  subtitle: string;
  actionLabel: string;
  responseHint: string;
  value: string;
};

const faqs: SupportFaq[] = [
  {
    id: 'faq_withdraw_earnings',
    question: 'How do I withdraw my earnings?',
    answer:
      'Go to Wallet, tap Withdraw, choose your payout method, and confirm the request. Completed withdrawals usually settle within 1-3 business days.',
    category: 'payments_escrow',
  },
  {
    id: 'faq_escrow_system',
    question: 'How does the escrow system work?',
    answer:
      'Clients fund escrow before work starts. Funds are held securely and released when milestones are approved, or resolved through dispute review if needed.',
    category: 'payments_escrow',
  },
  {
    id: 'faq_change_username',
    question: 'Can I change my username?',
    answer:
      'You can update your display name from profile settings. If you need to change account-identifying details, contact support for verification.',
    category: 'profile_account',
  },
  {
    id: 'faq_service_fees',
    question: 'What are the service fees?',
    answer:
      'Service fees vary by transaction type. You will always see a fee breakdown before confirming payments or withdrawals.',
    category: 'payments_escrow',
  },
  {
    id: 'faq_account_security',
    question: 'How can I secure my account?',
    answer:
      'Use a strong password, enable two-factor authentication, and avoid sharing login or payment details through chat.',
    category: 'trust_safety',
  },
];

const channels: SupportChannel[] = [
  {
    id: 'chat',
    title: 'Chat Support',
    subtitle: 'Live support for urgent issues',
    actionLabel: 'Start Chat',
    responseHint: '< 2 min wait',
    value: 'in-app-chat',
  },
  {
    id: 'email',
    title: 'Email Us',
    subtitle: 'For account and billing requests',
    actionLabel: 'Send Email',
    responseHint: 'Replies in 24h',
    value: 'support@tibeb.com',
  },
];

export async function getSupportFaqs(query?: string) {
  if (!query?.trim()) {
    return faqs;
  }
  const q = query.trim().toLowerCase();
  return faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );
}

export async function getSupportChannels() {
  return channels;
}
