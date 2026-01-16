// src/pages/AdminPage.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Database, Sheet } from "lucide-react";
import SheetsDataTable from "@/components/SheetsDataTable";

// If you have existing Supabase data component, keep it
// import SupabaseDataTable from "@/components/SupabaseDataTable";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("sheets");

  const exportToCSV = () => {
    // Add CSV export functionality
    toast({
      title: "Export started",
      description: "Preparing CSV download...",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and analyze feedback data from multiple sources
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All Data
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="sheets" className="flex items-center gap-2">
              <Sheet className="h-4 w-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sheets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Sheets Integration</CardTitle>
                <CardDescription>
                  View feedback data directly from your Google Sheet. 
                  Data updates automatically when the sheet changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <SheetsDataTable />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Connection Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm">Connected to backend on port 5000</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Ensure your Google Sheet is shared with the service account.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="database">
            {/* Keep your existing Supabase/database content here */}
            <Card>
              <CardHeader>
                <CardTitle>Database Feedback</CardTitle>
                <CardDescription>
                  Feedback stored in your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Your existing database table component goes here */}
                <p className="text-muted-foreground">Database feedback table would appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}