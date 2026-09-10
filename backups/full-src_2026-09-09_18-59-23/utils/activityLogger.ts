interface Activity {
  id: string;
  type: 'command' | 'music' | 'member' | 'moderation';
  action: string;
  user: string;
  timestamp: number;
  icon: string;
  color: string;
}

class ActivityLogger {
  private activities: Activity[] = [];
  private maxActivities = 50;

  log(type: Activity['type'], action: string, user: string, icon: string = '✅', color: string = '#10b981') {
    const activity: Activity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      action,
      user,
      timestamp: Date.now(),
      icon,
      color
    };

    this.activities.unshift(activity);

    // Keep only last N activities
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
  }

  getActivities(limit?: number): Activity[] {
    return limit ? this.activities.slice(0, limit) : this.activities;
  }

  clear() {
    this.activities = [];
  }
}

export const activityLogger = new ActivityLogger();
export type { Activity };
