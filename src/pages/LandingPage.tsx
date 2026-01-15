import { useNavigate } from 'react-router-dom';
import { MessageSquare, Shield, Users, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
      <div className="vox-card max-w-4xl w-full animate-fade-in">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-12 md:p-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-8 backdrop-blur">
              <MessageSquare className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Welcome to <span className="text-accent">Vox</span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Your voice shapes our leadership. Share honest, anonymous feedback to help build a stronger organization.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="p-8 md:p-12 bg-white">
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 border border-border">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">100% Anonymous</h3>
                <p className="text-sm text-muted-foreground">Your identity is protected with advanced encryption</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 border border-border">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Enterprise-grade security protects your data</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 border border-border">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">360° Feedback</h3>
                <p className="text-sm text-muted-foreground">Comprehensive leadership evaluation</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button
              onClick={() => navigate('/feedback')}
              className="vox-btn-primary flex-1 group"
              size="lg"
            >
              Give Feedback
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white"
              size="lg"
            >
              Admin Panel
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Vox is a secure, confidential 360-degree feedback platform designed to collect anonymous input regarding organizational leadership and management performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
