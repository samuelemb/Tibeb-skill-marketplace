"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  MapPin, 
  Phone,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const logoHref = isAuthenticated ? '/dashboard' : '/';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const footerLinks = {
    forClients: [
      { label: 'How to Hire', href: '/how-it-works' },
      { label: 'Talent Marketplace', href: '/jobs' },
      { label: 'Project Catalog', href: '/projects' },
      { label: 'Enterprise', href: '/enterprise' },
      { label: 'Payroll Services', href: '/payroll' },
    ],
    forFreelancers: [
      { label: 'How to Find Work', href: '/how-it-works' },
      { label: 'Direct Contracts', href: '/contracts' },
      { label: 'Find Jobs', href: '/jobs' },
      { label: 'Career Resources', href: '/resources' },
      { label: 'Community', href: '/community' },
    ],
    resources: [
      { label: 'Help & Support', href: '/support' },
      { label: 'Success Stories', href: '/stories' },
      { label: 'Blog', href: '/blog' },
      { label: 'Affiliate Program', href: '/affiliate' },
      { label: 'API Documentation', href: '/api-docs' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Trust & Safety', href: '/trust' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href={logoHref} className="flex items-center space-x-2 mb-4">
              <Image
                src="/footerlogo.png"
                alt="Tibeb"
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg object-contain"
              />
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              Connect with top talent and find your next opportunity. Tibeb is the leading 
              freelance marketplace for professionals in Ethiopia and beyond.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="h-5 w-5 text-indigo-400" />
                <span>Mekelle, Ethiopia</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="h-5 w-5 text-indigo-400" />
                <a href="mailto:hello@tibeb.com" className="hover:text-white transition-colors">
                  hello@tibeb.shop
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="h-5 w-5 text-indigo-400" />
                <a href="tel:+251963474290" className="hover:text-white transition-colors">
                  +251 963 474 290
                </a>
              </div>
            </div>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Clients</h4>
            <ul className="space-y-3">
              {footerLinks.forClients.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Freelancers</h4>
            <ul className="space-y-3">
              {footerLinks.forFreelancers.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              <span>&copy; {new Date().getFullYear()} Tibeb. All rights reserved.</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
