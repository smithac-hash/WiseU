import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Target, 
  BrainCircuit, 
  MessageSquareText, 
  Bell,
  Star,
  CheckCircle2
} from 'lucide-react';

const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'Smart Dashboard',
      description: 'Visual spending breakdown with charts and monthly summaries',
      icon: BarChart3
    },
    {
      title: 'Expense Calendar',
      description: 'See your spending patterns day by day, color-coded green to red',
      icon: CalendarIcon
    },
    {
      title: 'Budget Tracker',
      description: 'Set limits per category with safe/caution/red zone indicators',
      icon: Target
    },
    {
      title: 'AI Insights',
      description: 'Powered by Membrain AI — personalized tips that learn from your habits',
      icon: BrainCircuit
    },
    {
      title: 'SMS Auto-Extract',
      description: 'Paste any bank SMS and auto-detect amount, merchant, category',
      icon: MessageSquareText
    },
    {
      title: 'Smart Alerts',
      description: 'Daily notifications when you\'re close to your budget limits',
      icon: Bell
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Sign Up & Set Goals',
      description: 'Enter your monthly income and savings target'
    },
    {
      number: '2',
      title: 'Track Every Rupee',
      description: 'Add expenses manually or paste bank SMS for auto-fill'
    },
    {
      number: '3',
      title: 'Get AI Coaching',
      description: 'Membrain AI analyzes your habits and gives personalized tips'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      uni: 'Delhi University',
      quote: "WiseU helped me save enough to pay off my semester fees early. The SMS tracker is pure magic!",
      initials: 'PS',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      name: 'Rahul Verma',
      uni: 'IIT Bombay',
      quote: "The Membrain AI insights made me realize how much I was spending on food. Easily the best student finance app.",
      initials: 'RV',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      name: 'Ananya Patel',
      uni: 'Christ University',
      quote: "The budget zones turn saving money into a game. I finally hit my ₹5000/month savings goal!",
      initials: 'AP',
      color: 'bg-amber-100 text-amber-700'
    }
  ];

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-[#EEEDFE] selection:text-[#534AB7]">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
          <div className="text-2xl font-black text-[#534AB7] flex items-center gap-2">
            WiseU <span className="text-3xl">🎓</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-[#534AB7] font-medium transition-colors">Login</Link>
            <Link to="/register" className="bg-[#534AB7] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#463b9f] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#EEEDFE] to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Text Content */}
            <div className="max-w-2xl text-center lg:text-left z-10 animate-fade-in-up">
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.15]">
                Spend Smart. <br className="hidden lg:block"/>
                <span className="text-[#534AB7]">Save More.</span> <br className="hidden lg:block"/>
                Graduate Richer.
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                WiseU is your AI-powered personal finance companion built for students. Track expenses, set budgets, and get real-time insights — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="bg-[#534AB7] text-white px-8 py-3.5 rounded-full font-bold text-lg hover:bg-[#463b9f] transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-center">
                  Get Started Free
                </Link>
                <a href="#how-it-works" className="border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-full font-bold text-lg hover:border-[#534AB7] hover:text-[#534AB7] transition-all text-center">
                  See How It Works
                </a>
              </div>
            </div>

            {/* Floating Mockup */}
            <div className="relative z-10 hidden lg:block perspective-1000">
              <div className="relative w-full max-w-lg mx-auto transform rotate-y-[-10deg] rotate-x-[5deg] animate-float shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-100">
                {/* Mockup Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="font-semibold text-gray-500 text-sm">Dashboard</div>
                </div>
                {/* Mockup Body */}
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Total Spent</div>
                      <div className="text-3xl font-bold text-gray-900">₹4,250</div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Safe Zone</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-gray-700">Recent Insights</div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3">
                      <BrainCircuit className="w-5 h-5 text-[#534AB7] flex-shrink-0" />
                      <div className="text-sm text-indigo-900">You're spending 20% less on food this week! Keep it up to hit your ₹5K savings goal.</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">Food & Dining</span>
                      <span className="text-gray-500">₹1,500 / ₹3,000</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative blobs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#EEEDFE] rounded-full blur-3xl -z-10 opacity-70 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#534AB7] mb-3 uppercase tracking-wider text-sm font-semibold">Features</h2>
            <h3 className="text-4xl font-extrabold text-gray-900 mb-4">Everything you need to graduate debt-free</h3>
            <p className="text-lg text-gray-600">Powerful tools designed specifically for the student lifestyle.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-[#534AB7] rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">3 steps to financial freedom</h2>
            <p className="text-lg text-gray-600">Getting started with WiseU takes less than two minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[28px] left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10"></div>
            
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-[#534AB7] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-6 shadow-[#534AB7]/20 border-4 border-white">
                  {step.number}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h4>
                <p className="text-gray-600 leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-[#534AB7] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-white/20">
            <div className="p-4">
              <div className="text-4xl font-black text-white mb-2">10,000+</div>
              <div className="text-indigo-200 font-medium">Students</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-black text-white mb-2">₹2Cr+</div>
              <div className="text-indigo-200 font-medium">Saved</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-black text-white mb-2">95%</div>
              <div className="text-indigo-200 font-medium">Hit Their Goals</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-black text-white mb-2 flex justify-center"><BrainCircuit className="w-10 h-10" /></div>
              <div className="text-indigo-200 font-medium">Powered by Membrain AI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">What students say</h2>
            <p className="text-lg text-gray-600">Don't just take our word for it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic leading-relaxed mb-8">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${testimonial.color}`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">{testimonial.name}</h5>
                    <p className="text-sm text-gray-500">{testimonial.uni}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-[8px] border-[#534AB7] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-center md:text-left">
              <div className="text-2xl font-black text-[#534AB7] flex items-center justify-center md:justify-start gap-2 mb-2">
                WiseU <span className="text-3xl">🎓</span>
              </div>
              <p className="text-gray-500">Spend smart. Save more. Graduate richer.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-[#534AB7] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#534AB7] transition-colors">How It Works</a>
              <a href="#" className="hover:text-[#534AB7] transition-colors">About</a>
              <a href="#" className="hover:text-[#534AB7] transition-colors">Contact</a>
            </div>
            
            <div className="flex gap-4">
              <Link to="/login" className="px-5 py-2 rounded-full border border-gray-200 text-gray-700 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors font-medium text-sm">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2 rounded-full bg-[#534AB7] text-white hover:bg-[#463b9f] transition-colors font-medium text-sm">
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
            <p>Made with ❤️ for students. © {new Date().getFullYear()} WiseU.</p>
          </div>
        </div>
      </footer>

      {/* Tailwind Custom Animations Style Block */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(5deg) rotateY(-10deg); }
          50% { transform: translateY(-20px) rotateX(5deg) rotateY(-10deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1) translateX(-50%) translateY(-50%); }
          50% { opacity: 0.8; transform: scale(1.05) translateX(-50%) translateY(-50%); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} />
    </div>
  );
};

export default Landing;
