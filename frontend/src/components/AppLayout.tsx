"use client";

import React from 'react';
import Link from 'next/link';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Briefcase,
  Users,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Globe,
  Zap,
  Award,
  Clock,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

const heroImage = "/images/hero.png";
const abstractPattern = "/images/pattern.png";

const freelancerImages = [
  "/images/freelancers/f1.jpg",
  "/images/freelancers/f2.jpg",
  "/images/freelancers/f3.png",
  "/images/freelancers/f4.jpg",
];

const categories = [
  { name: 'Web Development', count: 2340, icon: Globe },
  { name: 'Mobile Apps', count: 1856, icon: Zap },
  { name: 'UI/UX Design', count: 1432, icon: Award },
  { name: 'Content Writing', count: 987, icon: MessageSquare },
  { name: 'Digital Marketing', count: 1234, icon: TrendingUp },
  { name: 'Data Science', count: 756, icon: Search },
];

const featuredJobs = [
  {
    id: '1',
    title: 'Senior React Developer for E-commerce Platform',
    company: 'Memi Trading PLC',
    budget: 'Br 30,000 - Br 50,000',
    type: 'Fixed Price',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    posted: '2 hours ago',
    proposals: 12,
  },
  {
    id: '2',
    title: 'Mobile App Designer',
    company: ' ',
    budget: 'Br 500 - Br 800/hr',
    type: 'Hourly',
    skills: ['Figma', 'UI/UX', 'Mobile Design', 'Prototyping'],
    posted: '5 hours ago',
    proposals: 8,
  },
  {
    id: '3',
    title: 'Full Stack Developer for Healthcare App',
    company: 'MedConnect',
    budget: 'Br 32,000 - Br 40,000',
    type: 'Fixed Price',
    skills: ['Python', 'Django', 'React', 'AWS'],
    posted: '1 day ago',
    proposals: 24,
  },
  {
    id: '4',
    title: 'Content Writer for Tech Blog',
    company: 'Digital Tigray',
    budget: 'Br 250 - Br 400/hr',
    type: 'Hourly',
    skills: ['Technical Writing', 'SEO', 'Research', 'Editing'],
    posted: '3 hours ago',
    proposals: 15,
  },
];

const testimonials = [
  {
    name: 'Teamrat Kidu',
    role: 'CEO, TechStart Ethiopia',
    image: freelancerImages[0],
    content: 'Tibeb has transformed how we hire talent. We found an amazing developer within days who delivered exceptional work.',
    rating: 5,
  },
  {
    name: 'Mahlet Abadi',
    role: 'Freelance Designer',
    image: freelancerImages[1],
    content: 'As a freelancer, Tibeb has been a game-changer. The platform is intuitive and I\'ve connected with clients from across Africa.',
    rating: 5,
  },
  {
    name: 'Samuel Embaye',
    role: 'Product Manager, FinanceHub',
    image: freelancerImages[2],
    content: 'The quality of freelancers on Tibeb is outstanding. We\'ve built long-term relationships with talented professionals.',
    rating: 5,
  },
];

const stats = [
  { label: 'Active Freelancers', value: '50K+', icon: Users },
  { label: 'Jobs Posted', value: '120K+', icon: Briefcase },
  { label: 'Projects Completed', value: '85K+', icon: CheckCircle },
  { label: 'Total Earnings', value: 'Br 25M+', icon: DollarSign },
];

const AppLayout: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.location.hash !== '#how-it-works') {
      return;
    }

    const target = document.getElementById('how-it-works');
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${abstractPattern})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30">
                  Africa's Leading Freelance Marketplace
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Find the Perfect{' '}
                  <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                    Talent
                  </span>{' '}
                  for Your Project
                </h1>
                <p className="text-lg md:text-xl text-indigo-200 mb-8 max-w-xl mx-auto lg:mx-0">
                  Connect with skilled freelancers and clients. Build your career or grow your 
                  business with Tibeb's trusted marketplace.
                </p>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto lg:mx-0 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for jobs or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <Button 
                    type="submit"
                    size="lg" 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 h-auto rounded-xl"
                  >
                    Search Jobs
                  </Button>
                </form>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/register?role=client')}
                    className="bg-white text-indigo-900 hover:bg-gray-100 px-8"
                  >
                    <Briefcase className="mr-2 h-5 w-5" />
                    Hire Talent
                  </Button>
                <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => router.push('/register?role=freelancer')}
                    className="border-white/60 text-white bg-white/10 hover:bg-white/20 px-8"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Find Work
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-indigo-200">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    <span className="text-sm">Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm">Verified Freelancers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <span className="text-sm">24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="hidden lg:block relative">
                <div className="relative">
                  <Image
                        src={heroImage}
                        alt="Freelancer working"
                         width={600}
                         height={400}
                         className="rounded-2xl shadow-2xl"
  priority
/>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 border-y">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 mb-3">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-24 scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Browse by Category
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Find the perfect freelancer for your project from our diverse range of categories
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/jobs?category=${encodeURIComponent(category.name)}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-2 hover:border-indigo-200">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-indigo-50 text-indigo-600 mb-4 group-hover:bg-indigo-100 transition-colors">
                        <category.icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.count.toLocaleString()} jobs</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Featured Jobs
                </h2>
                <p className="text-lg text-gray-600">
                  Explore the latest opportunities from top clients
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push('/jobs')}
                className="mt-4 md:mt-0"
              >
                View All Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                          {job.title}
                        </h3>
                        <p className="text-gray-600">{job.company}</p>
                      </div>
                      <Badge variant={job.type === 'Fixed Price' ? 'default' : 'secondary'}>
                        {job.type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="bg-gray-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-indigo-600">{job.budget}</span>
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>{job.proposals} proposals</span>
                        <span>{job.posted}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Tibeb Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get started in minutes and find the perfect match for your needs
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-16">
              {/* For Clients */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Clients</h3>
                </div>
                <div className="space-y-8">
                  {[
                    { step: '1', title: 'Post Your Job', desc: 'Describe your project and set your budget' },
                    { step: '2', title: 'Review Proposals', desc: 'Compare freelancer profiles and proposals' },
                    { step: '3', title: 'Hire & Collaborate', desc: 'Work together and track progress' },
                    { step: '4', title: 'Pay Securely', desc: 'Release payment when satisfied' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="mt-8 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => router.push('/register?role=client')}
                >
                  Post a Job
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* For Freelancers */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Freelancers</h3>
                </div>
                <div className="space-y-8">
                  {[
                    { step: '1', title: 'Create Your Profile', desc: 'Showcase your skills and experience' },
                    { step: '2', title: 'Find Jobs', desc: 'Browse and search for relevant opportunities' },
                    { step: '3', title: 'Submit Proposals', desc: 'Apply with your best pitch and rate' },
                    { step: '4', title: 'Get Paid', desc: 'Receive secure payments for your work' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="mt-8 bg-orange-500 hover:bg-orange-600"
                  onClick={() => router.push('/register?role=freelancer')}
                >
                  Start Freelancing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-indigo-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                What Our Users Say
              </h2>
              <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
                Join thousands of satisfied clients and freelancers
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <Card key={i} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white mb-6">{testimonial.content}</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-sm text-indigo-300">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url(${abstractPattern})`,
                  backgroundSize: 'cover',
                }}
              />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
                  Join Tibeb today and connect with talented professionals or find your next opportunity.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    onClick={() => router.push('/register?role=client')}
                    className="bg-white text-indigo-900 hover:bg-gray-100 px-8"
                  >
                    Hire Talent
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/register?role=freelancer')}
                    className="border-white/60 text-white bg-white/10 hover:bg-white/20 px-8"
                  >
                    Find Work
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
