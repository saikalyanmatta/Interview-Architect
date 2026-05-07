import { useState } from "react";
import { Link } from "wouter";
import { useListJobProfiles, useCreateJobProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Briefcase, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EmployerJobProfiles() {
  const { data: profiles, isLoading } = useListJobProfiles();
  const createProfile = useCreateJobProfile();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile.mutate(
      { data: { title, description, skills: [] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/employer/job-profiles"] });
          setIsOpen(false);
          setTitle("");
          setDescription("");
        }
      }
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Profiles</h1>
          <p className="text-muted-foreground mt-1">Manage role definitions and required skills</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Job Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Senior Frontend Engineer" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Role responsibilities..." 
                  required 
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createProfile.isPending}>
                  {createProfile.isPending ? "Creating..." : "Create Profile"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading profiles...</div>
      ) : profiles?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">No job profiles yet</h3>
            <p className="text-muted-foreground mb-4">Create your first job profile to start setting up interviews.</p>
            <Button variant="outline" onClick={() => setIsOpen(true)}>Create Profile</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles?.map((profile) => (
            <Link key={profile.id} href={`/employer/job-profiles/${profile.id}`}>
              <Card className="hover-elevate cursor-pointer h-full border hover:border-primary transition-all group">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="line-clamp-2">{profile.title}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  <CardDescription className="line-clamp-2 pt-2">
                    {profile.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}