
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center"><Settings className="mr-2 h-6 w-6 text-primary" />System Settings</CardTitle>
          <CardDescription>Configure system-wide settings for AttendEase. (This page is a placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Settings className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Settings Page Under Construction</h3>
            <p className="text-muted-foreground">Advanced system configuration options will be available here in a future update.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
