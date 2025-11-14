"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTask } from "~/server/actions";
import { toast } from "~/hooks/use-toast";
import { useSession } from "~/lib/auth-client";

const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["done", "in-progress", "backlog", "in-review", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  eventId: number;
  initialStatus?: string;
  trigger?: React.ReactNode;
  teamMembers?: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
}

export function CreateTaskModal({
  eventId,
  initialStatus = "backlog",
  trigger,
  teamMembers = [],
}: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: (initialStatus as "done" | "in-progress" | "backlog" | "in-review" | "cancelled") || "backlog",
      priority: "medium",
      assignedTo: "unassigned",
      dueDate: "",
    },
  });

  const onSubmit = async (data: CreateTaskForm) => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create tasks",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("status", data.status);
      formData.append("priority", data.priority);
      formData.append("eventId", eventId.toString());
      formData.append("assignedTo", data.assignedTo === "unassigned" ? "" : data.assignedTo || "");
      formData.append("dueDate", data.dueDate || "");

      const result = await createTask(formData, session.user.id);

      if (result.success) {
        toast({
          title: "Task created",
          description: result.message,
        });
        form.reset();
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create task error:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task for this event. You can assign it to team members
            and set priorities.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title..."
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the task..."
                      className="resize-none"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger disabled={loading}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="in-review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger disabled={loading}>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger disabled={loading}>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
