import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  Inbox, 
  BookOpen, 
  Settings,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Megaphone, label: 'Campaigns', path: '/campaigns' },
  { icon: Users, label: 'CRM', path: '/crm' },
  { icon: Inbox, label: 'Inbox', path: '/inbox' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge' },
];

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-mesh overflow-hidden p-2 sm:p-4 gap-4 relative">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel flex flex-col transition-all z-10 relative h-[calc(100vh-32px)] overflow-hidden">
        <div className="h-20 flex items-center px-6 border-b border-white/10 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mr-3">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">MailPilot</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative",
                  isActive 
                    ? "bg-primary/20 text-primary shadow-inner" 
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full animate-enter" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 dark:border-white/5 mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group",
                isActive 
                  ? "bg-primary/20 text-primary shadow-inner" 
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )
            }
          >
            <Settings className="w-5 h-5 mr-3 group-hover:rotate-45 transition-transform duration-500" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-32px)] overflow-hidden z-10 relative">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-end px-8">
          <div className="flex items-center space-x-4 glass px-4 py-2 rounded-full cursor-pointer hover-scale">
            <span className="text-sm font-medium mr-2">Admin</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent shadow-lg flex items-center justify-center text-white font-bold text-sm border border-white/20">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 relative scroll-smooth">
          <div className="max-w-6xl mx-auto animate-fade-in pb-20">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
