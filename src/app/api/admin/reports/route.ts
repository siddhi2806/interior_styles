import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

interface UserActivity {
  renders: number;
  credits: number;
}

interface TopUser {
  userId: string;
  renders: number;
  credits: number;
}

interface StylePopularity {
  name: string;
  count: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

interface DailyUsage {
  date: string;
  credits: number;
  renders: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get("adminUserId");
    const period = searchParams.get("period") || "30"; // days

    if (!adminUserId) {
      return NextResponse.json(
        { error: "Admin user ID required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", adminUserId)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const periodDays = parseInt(period);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - periodDays);

    // Get user registration stats
    const { data: userStats, error: userStatsError } = await supabaseAdmin
      .from("users")
      .select("created_at, blocked")
      .gte("created_at", dateFrom.toISOString());

    if (userStatsError) {
      console.error("Error fetching user stats:", userStatsError);
      return NextResponse.json(
        { error: "Failed to fetch user stats" },
        { status: 500 }
      );
    }

    // Get usage stats
    const { data: usageStats, error: usageStatsError } = await supabaseAdmin
      .from("usage_logs")
      .select("created_at, type, amount, user_id")
      .gte("created_at", dateFrom.toISOString());

    if (usageStatsError) {
      console.error("Error fetching usage stats:", usageStatsError);
      return NextResponse.json(
        { error: "Failed to fetch usage stats" },
        { status: 500 }
      );
    }

    // Get project stats
    const { data: projectStats, error: projectStatsError } = await supabaseAdmin
      .from("projects")
      .select("created_at, user_id")
      .gte("created_at", dateFrom.toISOString());

    if (projectStatsError) {
      console.error("Error fetching project stats:", projectStatsError);
      return NextResponse.json(
        { error: "Failed to fetch project stats" },
        { status: 500 }
      );
    }

    // Get render stats
    const { data: renderStats, error: renderStatsError } = await supabaseAdmin
      .from("project_images")
      .select("created_at, user_id, style_id")
      .gte("created_at", dateFrom.toISOString());

    if (renderStatsError) {
      console.error("Error fetching render stats:", renderStatsError);
      return NextResponse.json(
        { error: "Failed to fetch render stats" },
        { status: 500 }
      );
    }

    // Get style usage stats
    const { data: styleStats, error: styleStatsError } = await supabaseAdmin
      .from("project_images")
      .select("style_id, styles(name)")
      .gte("created_at", dateFrom.toISOString());

    if (styleStatsError) {
      console.error("Error fetching style stats:", styleStatsError);
      return NextResponse.json(
        { error: "Failed to fetch style stats" },
        { status: 500 }
      );
    }

    // Process data for charts
    const processedData = {
      userRegistrations: processTimeSeriesData(
        userStats,
        "created_at",
        periodDays
      ),
      dailyUsage: processDailyUsage(usageStats, renderStats, periodDays),
      topUsers: processTopUsers(usageStats, renderStats),
      stylePopularity: processStylePopularity(styleStats),
      summary: {
        totalUsers: userStats.length,
        blockedUsers: userStats.filter((u) => u.blocked).length,
        totalProjects: projectStats.length,
        totalRenders: renderStats.length,
        totalCreditsUsed: usageStats
          .filter((u) => u.type === "render")
          .reduce((sum, u) => sum + Math.abs(u.amount), 0),
        averageRendersPerUser:
          renderStats.length / Math.max(userStats.length, 1),
        averageProjectsPerUser:
          projectStats.length / Math.max(userStats.length, 1),
      },
    };

    return NextResponse.json(processedData);
  } catch (error) {
    console.error("Admin reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function processTimeSeriesData(
  data: any[],
  dateField: string,
  days: number
): TimeSeriesData[] {
  const result: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const count = data.filter((item) => {
      const itemDate = new Date(item[dateField]).toISOString().split("T")[0];
      return itemDate === dateStr;
    }).length;

    result.push({
      date: dateStr,
      count,
    });
  }

  return result;
}

function processDailyUsage(
  usageStats: any[],
  renderStats: any[],
  days: number
): DailyUsage[] {
  const result: DailyUsage[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const credits = usageStats
      .filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0];
        return itemDate === dateStr && item.type === "render";
      })
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const renders = renderStats.filter((item) => {
      const itemDate = new Date(item.created_at).toISOString().split("T")[0];
      return itemDate === dateStr;
    }).length;

    result.push({
      date: dateStr,
      credits,
      renders,
    });
  }

  return result;
}

function processTopUsers(usageStats: any[], renderStats: any[]): TopUser[] {
  const userActivity: Record<string, UserActivity> = {};

  // Count renders per user
  renderStats.forEach((render) => {
    if (!userActivity[render.user_id]) {
      userActivity[render.user_id] = { renders: 0, credits: 0 };
    }
    userActivity[render.user_id].renders++;
  });

  // Count credits used per user
  usageStats
    .filter((u) => u.type === "render")
    .forEach((usage) => {
      if (!userActivity[usage.user_id]) {
        userActivity[usage.user_id] = { renders: 0, credits: 0 };
      }
      userActivity[usage.user_id].credits += Math.abs(usage.amount);
    });

  // Convert to array and sort
  return Object.entries(userActivity)
    .map(
      ([userId, stats]): TopUser => ({
        userId,
        renders: stats.renders,
        credits: stats.credits,
      })
    )
    .sort((a, b) => b.renders - a.renders)
    .slice(0, 10);
}

function processStylePopularity(styleStats: any[]): StylePopularity[] {
  const styleCounts: Record<string, number> = {};

  styleStats.forEach((item) => {
    const styleName = item.styles?.name || "Unknown";
    styleCounts[styleName] = (styleCounts[styleName] || 0) + 1;
  });

  return Object.entries(styleCounts)
    .map(([name, count]): StylePopularity => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
