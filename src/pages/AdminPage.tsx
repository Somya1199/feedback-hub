import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, FileText, Mail, LogOut, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockAdminStats } from '@/lib/mockData';

type AdminTab = 'home' | 'analytics' | 'logs' | 'reminders';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const stats = mockAdminStats;

  const participationRate = stats.totalEmployees > 0 
    ? Math.round((stats.uniqueSubmitters / stats.totalEmployees) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-accent">Vox Admin</h2>
        </div>
        
        <nav className="flex-1 py-4">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'logs', icon: FileText, label: 'Logs' },
            { id: 'reminders', icon: Mail, label: 'Reminders' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full vox-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-white/70 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-muted overflow-auto">
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
            <p className="text-muted-foreground mb-8">Welcome back, Admin. Here is the current status.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="vox-stat-card">
                <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
                <span className="vox-stat-number">{stats.uniqueSubmitters}</span>
                <span className="vox-stat-label">Unique Submitters</span>
              </div>
              <div className="vox-stat-card">
                <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
                <span className="vox-stat-number">{stats.totalResponses}</span>
                <span className="vox-stat-label">Total Responses</span>
              </div>
              <div className="vox-stat-card">
                <AlertTriangle className="w-8 h-8 text-accent mx-auto mb-2" />
                <span className="vox-stat-number">{stats.totalEmployees - stats.uniqueSubmitters}</span>
                <span className="vox-stat-label">Pending Users</span>
              </div>
            </div>

            <div className="vox-chart-container">
              <h3 className="text-xl font-bold text-foreground mb-4">Responses by Quarter</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(stats.quarterlyData).map(([quarter, count]) => (
                  <div key={quarter} className="text-center p-4 bg-accent/10 rounded-xl border border-accent/30">
                    <span className="text-2xl font-bold text-secondary">{count}</span>
                    <p className="text-sm text-muted-foreground">{quarter}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Analytics</h1>
            
            <div className="vox-chart-container mb-6">
              <h3 className="text-xl font-bold mb-4">Participation Rate</h3>
              <div className="text-center">
                <span className="text-5xl font-bold text-secondary">{participationRate}%</span>
                <p className="text-muted-foreground mt-2">{stats.uniqueSubmitters} out of {stats.totalEmployees} employees submitted.</p>
              </div>
            </div>

            <div className="vox-chart-container">
              <h3 className="text-xl font-bold mb-4">Leader Scoreboard</h3>
              <table className="vox-table w-full">
                <thead>
                  <tr>
                    <th>Leader</th>
                    <th>Mean Score</th>
                    <th>Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leaderMeanScores.map(leader => (
                    <tr key={leader.name}>
                      <td className="font-medium">{leader.name.split('@')[0]}</td>
                      <td><span className={`font-bold ${leader.meanScore >= 70 ? 'text-success' : leader.meanScore >= 50 ? 'text-accent' : 'text-destructive'}`}>{leader.meanScore}</span></td>
                      <td>{leader.totalAnswers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Activity Logs</h1>
            <div className="vox-chart-container">
              <table className="vox-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Role</th>
                    <th>Process</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td>{log.date}</td>
                      <td>{log.role}</td>
                      <td>{log.process}</td>
                      <td>{log.target.split('@')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-8">Email Reminders</h1>
            <div className="vox-chart-container text-center py-12">
              <Mail className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Send Reminders</h3>
              <p className="text-muted-foreground mb-6">Send email to employees who haven't submitted feedback yet.</p>
              <Button className="vox-btn-primary">Send Emails Now</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
