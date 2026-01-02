import Link from "next/link";
import { Users, Settings, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    title: "User Management",
    description: "View and manage user accounts and roles",
    href: "/admin/users",
    icon: Users,
    available: true,
  },
  {
    title: "Configuration",
    description: "System settings and preferences",
    href: "#",
    icon: Settings,
    available: false,
  },
  {
    title: "Analytics",
    description: "Usage statistics and insights",
    href: "#",
    icon: BarChart3,
    available: false,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your application settings and users
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const content = (
            <Card
              className={
                feature.available
                  ? "hover:border-primary/50 transition-colors cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </div>
                </div>
                {!feature.available && (
                  <span className="text-xs text-muted-foreground mt-2 block">
                    Coming soon
                  </span>
                )}
              </CardHeader>
            </Card>
          );

          return feature.available ? (
            <Link key={feature.title} href={feature.href}>
              {content}
            </Link>
          ) : (
            <div key={feature.title}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
