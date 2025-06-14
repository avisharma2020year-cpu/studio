"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mockUsers } from '@/data/mock-data';
import type { User, UserRole } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit2, Trash2, Search, Users, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const initialNewUserState: Omit<User, 'id'> = {
  name: '',
  email: '',
  role: 'student',
  prn: '',
  course: '',
  semester: undefined,
  subjects: [],
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id'>>(initialNewUserState);

  useEffect(() => {
    setUsers(mockUsers); // Load initial mock data
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'semester' ? (value ? parseInt(value) : undefined) : value }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData(prev => ({ ...prev, role: value, prn: '', course: '', semester: undefined, subjects: [] }));
  };
  
  const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s) }));
  };

  const openFormForEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      prn: user.prn || '',
      course: user.course || '',
      semester: user.semester,
      subjects: user.subjects || [],
    });
    setIsFormOpen(true);
  };
  
  const openFormForNew = () => {
    setEditingUser(null);
    setFormData(initialNewUserState);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Error", description: "Name and Email are required.", variant: "destructive" });
      return;
    }

    if (editingUser) {
      // Update user
      const updatedUsers = users.map(u => u.id === editingUser.id ? { ...editingUser, ...formData } : u);
      setUsers(updatedUsers);
      // Update mockUsers array as well for persistence in this demo
      const mockIndex = mockUsers.findIndex(u => u.id === editingUser.id);
      if (mockIndex !== -1) mockUsers[mockIndex] = { ...editingUser, ...formData };
      toast({ title: "Success", description: "User updated successfully." });
    } else {
      // Add new user
      const newUser: User = { id: `user${Date.now()}`, ...formData };
      setUsers(prev => [...prev, newUser]);
      mockUsers.push(newUser); // Add to mockUsers for persistence in this demo
      toast({ title: "Success", description: "User added successfully." });
    }
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Remove from mockUsers as well
      const mockIndex = mockUsers.findIndex(u => u.id === userId);
      if (mockIndex !== -1) mockUsers.splice(mockIndex, 1);
      toast({ title: "Success", description: "User deleted successfully." });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.prn && user.prn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === 'admin') return 'destructive';
    if (role === 'faculty') return 'secondary';
    return 'default'; // Student
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />User Management</CardTitle>
            <CardDescription>Add, edit, or remove users from the system.</CardDescription>
          </div>
          <Button onClick={openFormForNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Details</TableHead> {/* PRN/Course for Student, Subjects for Faculty */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.role === 'student' && `PRN: ${user.prn || 'N/A'}, ${user.course || 'N/A'} Sem ${user.semester || 'N/A'}`}
                        {user.role === 'faculty' && `Subjects: ${(user.subjects && user.subjects.length > 0) ? user.subjects.join(', ') : 'N/A'}`}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openFormForEdit(user)} aria-label="Edit user">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)} aria-label="Delete user">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <p className="text-center text-muted-foreground py-8">No users found matching your criteria.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update the details for this user.' : 'Fill in the details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'student' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prn" className="text-right">PRN</Label>
                  <Input id="prn" name="prn" value={formData.prn} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="course" className="text-right">Course</Label>
                  <Input id="course" name="course" value={formData.course} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="semester" className="text-right">Semester</Label>
                  <Input id="semester" name="semester" type="number" value={formData.semester || ''} onChange={handleInputChange} className="col-span-3" />
                </div>
              </>
            )}
            {formData.role === 'faculty' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjects" className="text-right">Subjects</Label>
                <Input id="subjects" name="subjects" value={(formData.subjects || []).join(', ')} onChange={handleSubjectsChange} className="col-span-3" placeholder="Comma-separated, e.g., Math, Physics"/>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingUser ? 'Save Changes' : 'Add User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
