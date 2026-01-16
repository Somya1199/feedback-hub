// src/components/SheetsDataTable.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchFeedbackResponses, type FeedbackResponse } from "@/services/sheetsApi"; // Added 'type' keyword

export default function SheetsDataTable() {
  const [data, setData] = useState<FeedbackResponse[]>([]); // Changed from FeedbackRow to FeedbackResponse
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    const result = await fetchFeedbackResponses(); // Using correct function
    
    if (result.success) {
      setData(result.data);
      toast({
        title: "Responses loaded",
        description: `Loaded ${result.data.length} feedback responses`,
        variant: "default",
      });
    } else {
      setError(result.error || "Failed to load responses");
      toast({
        title: "Error loading responses",
        description: result.error || "Please check backend connection",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800";
    if (rating >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Data</CardTitle>
          <CardDescription>Loading feedback data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Connection Error
          </CardTitle>
          <CardDescription>Failed to connect to Google Sheets backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure the Python backend is running on port 5000
            </p>
            <Button onClick={loadData} className="mt-4" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Data</CardTitle>
          <CardDescription>No feedback data found</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Google Sheet is connected but no data found.</p>
          <Button onClick={loadData} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get column headers from first data row
  const headers = Object.keys(data[0] || {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Google Sheets Feedback</CardTitle>
          <CardDescription>
            Real-time data from Google Sheets • {data.length} entries
          </CardDescription>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="font-medium">
                    {header.replace(/_/g, ' ').toUpperCase()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => {
                    const value = row[header];
                    
                    // Special formatting for specific columns
                    if (header.toLowerCase().includes('timestamp') || header.toLowerCase().includes('date')) {
                      return (
                        <TableCell key={header} className="text-sm">
                          {formatDate(String(value))}
                        </TableCell>
                      );
                    }
                    
                    if (header.toLowerCase().includes('rating')) {
                      const rating = Number(value);
                      return (
                        <TableCell key={header}>
                          <Badge className={getRatingColor(rating)}>
                            {rating}/5
                          </Badge>
                        </TableCell>
                      );
                    }
                    
                    if (header.toLowerCase().includes('feedback') || header.toLowerCase().includes('comment')) {
                      return (
                        <TableCell key={header} className="max-w-xs truncate">
                          {String(value)}
                        </TableCell>
                      );
                    }
                    
                    return (
                      <TableCell key={header} className="text-sm">
                        {String(value || '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}