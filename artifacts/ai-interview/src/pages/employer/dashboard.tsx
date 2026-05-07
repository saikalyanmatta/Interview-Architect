import { Link } from "wouter";
import { useGetEmployerStats, getGetEmployerStatsQueryKey, useListInterviews, getListInterviewsQueryKey } from "@workspace/api-client-react";
import { Loader2, Plus, Calendar, Briefcase, Users, CheckCircle2, TrendingUp } from "lucide-react";

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="w-7 h-7 bg-primary/10 rounded flex items-center justify-center">
          <Icon size={14} className="text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  closed: "bg-secondary text-muted-foreground border-border",
};

export default function EmployerDashboard() {
  const stats = useGetEmployerStats({ query: { queryKey: getGetEmployerStatsQueryKey() } });
  const interviews = useListInterviews({ query: { queryKey: getListInterviewsQueryKey() } });

  const recentInterviews = (interviews.data as any[])?.slice(0, 5) ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overview of your interview activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/employer/job-profiles/new" data-testid="link-new-job-profile" className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-medium transition-colors border border-border">
            <Plus size={13} /> Job Profile
          </Link>
          <Link href="/employer/interviews/new" data-testid="link-new-interview" className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors">
            <Plus size={13} /> Interview
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total Interviews" value={stats.data?.totalInterviews ?? 0} icon={Calendar} />
          <StatCard label="Active" value={stats.data?.activeInterviews ?? 0} icon={TrendingUp} sub="in progress" />
          <StatCard label="Total Sessions" value={stats.data?.totalSessions ?? 0} icon={Users} />
          <StatCard label="Completed" value={stats.data?.completedSessions ?? 0} icon={CheckCircle2} />
          <StatCard
            label="Avg Score"
            value={stats.data?.avgScore !== null && stats.data?.avgScore !== undefined ? `${stats.data.avgScore}/100` : "—"}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Recent interviews */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Interviews</h2>
          <Link href="/employer/interviews" data-testid="link-all-interviews" className="text-xs text-primary hover:underline">View all</Link>
        </div>

        {interviews.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
        ) : recentInterviews.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar size={28} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No interviews yet</p>
            <Link href="/employer/interviews/new" className="text-xs text-primary hover:underline mt-1 inline-block">Create your first interview</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentInterviews.map((interview: any) => (
              <Link key={interview.id} href={`/employer/interviews/${interview.id}`} data-testid={`row-interview-${interview.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{interview.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {interview.difficulty} · {interview.interviewerTone}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border capitalize ml-3 shrink-0 ${STATUS_COLORS[interview.status] ?? STATUS_COLORS.draft}`}>
                  {interview.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
