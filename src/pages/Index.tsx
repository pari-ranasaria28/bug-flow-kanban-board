
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, Users, BarChart3, Zap, CheckCircle, MessageSquare } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bug,
      title: "Bug Tracking",
      description: "Track and manage bugs with detailed descriptions, priority levels, and assignments."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members, assign tickets, and collaborate on projects with role-based access."
    },
    {
      icon: BarChart3,
      title: "Kanban Board",
      description: "Visualize your workflow with drag-and-drop Kanban boards for better project management."
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "See changes instantly as your team updates tickets and moves them through workflows."
    },
    {
      icon: CheckCircle,
      title: "Project Management",
      description: "Create and manage multiple projects with comprehensive ticket filtering and search."
    },
    {
      icon: MessageSquare,
      title: "Comments & Discussion",
      description: "Add comments to tickets for better communication and track progress discussions."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bug className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Bug Tracker</h1>
            </div>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Track Bugs Like a <span className="text-blue-600">Pro</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A powerful, intuitive bug tracking and project management tool designed for modern development teams. 
            Organize your work, collaborate effectively, and ship better software.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to track and fix bugs
            </h3>
            <p className="text-xl text-gray-600">
              Built for teams of all sizes, from startups to enterprise organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your bug tracking?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of development teams who trust Bug Tracker for their project management needs.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Bug className="h-6 w-6 text-blue-400 mr-2" />
            <span className="text-white font-semibold">Bug Tracker</span>
          </div>
          <p className="text-gray-400">
            © 2024 Bug Tracker. Built with React, TypeScript, and Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
