// src/components/ManagementMapping.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchManagementMapping, ManagementMapping } from "@/services/sheetsApi";
import { Mail, User } from "lucide-react";

export default function ManagementMappingTable() {
  const [data, setData] = useState<ManagementMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagementMapping().then(result => {
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading management data...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Management Team</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((manager, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {manager.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {manager.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{manager.department}</Badge>
                </TableCell>
                <TableCell>{manager.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}