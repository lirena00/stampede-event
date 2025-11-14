"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Plus,
  MoreHorizontal,
  Circle,
  CircleCheck,
  CirclePlay,
  CircleX,
  Eye,
  Clock,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { updateTaskStatus } from "~/server/actions";
import { toast } from "~/hooks/use-toast";

// Task status configuration with Linear-style colors and icons
const taskStatuses = {
  backlog: {
    label: "Backlog",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Circle,
    dotColor: "bg-gray-400",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CirclePlay,
    dotColor: "bg-blue-500",
  },
  "in-review": {
    label: "In Review",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Eye,
    dotColor: "bg-yellow-500",
  },
  done: {
    label: "Done",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CircleCheck,
    dotColor: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: CircleX,
    dotColor: "bg-red-500",
  },
} as const;

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600" },
  high: { label: "High", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-600" },
} as const;

interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string; // Allow any string status from database
  priority: string | null; // Allow any string priority from database
  assignedTo?: {
    name: string | null;
    email: string;
  } | null;
  createdBy: {
    name: string | null;
    email: string;
  };
  due_date?: string | Date | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

interface TaskColumnProps {
  status: keyof typeof taskStatuses;
  tasks: Task[];
  onTaskUpdate: (taskId: number, newStatus: keyof typeof taskStatuses) => void;
  onTaskCreate: (status: keyof typeof taskStatuses) => void;
}

function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const statusConfig =
    taskStatuses[task.status as keyof typeof taskStatuses] ||
    taskStatuses.backlog;
  const priorityStyle =
    priorityConfig[task.priority as keyof typeof priorityConfig] ||
    priorityConfig.medium;

  const handleStatusUpdate = async (newStatus: keyof typeof taskStatuses) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await updateTaskStatus(task.id, newStatus, "system");
      if (result?.success) {
        toast({
          title: "Task updated",
          description: `Task moved to ${taskStatuses[newStatus].label}`,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: "Failed to update task status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="mb-3 hover:shadow-md transition-all duration-200 cursor-pointer group bg-background border border-border hover:border-primary/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div
              className={cn(
                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                statusConfig.dotColor
              )}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight mb-1 wrap-break-word">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 wrap-break-word">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 shrink-0 ml-2"
                disabled={isUpdating}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(taskStatuses).map(([status, config]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() =>
                    handleStatusUpdate(status as keyof typeof taskStatuses)
                  }
                  className="flex items-center gap-2 cursor-pointer"
                  disabled={status === task.status || isUpdating}
                >
                  <config.icon className="h-4 w-4" />
                  <span>{config.label}</span>
                  {status === task.status && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Current
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Priority and Due Date Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {task.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 border-0 font-medium",
                  priorityStyle.color
                )}
              >
                {priorityStyle.label}
              </Badge>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(task.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Assignee Section */}
        {task.assignedTo && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage
                src=""
                alt={task.assignedTo.name || task.assignedTo.email}
              />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {task.assignedTo.name?.charAt(0)?.toUpperCase() ||
                  task.assignedTo.email.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge
              variant="secondary"
              className="text-xs font-normal bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              {task.assignedTo.name || task.assignedTo.email.split("@")[0]}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskColumn({
  status,
  tasks,
  onTaskCreate,
}: Omit<TaskColumnProps, "onTaskUpdate">) {
  const statusConfig = taskStatuses[status];

  return (
    <div className="flex-1 min-w-[280px] max-w-[340px] bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", statusConfig.dotColor)} />
          <h2 className="font-semibold text-sm text-foreground">
            {statusConfig.label}
          </h2>
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-background/80 rounded-md"
          onClick={() => onTaskCreate(status)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-xs">No tasks</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface LinearTaskBoardProps {
  tasks: Task[];
}

export function LinearTaskBoard({ tasks }: LinearTaskBoardProps) {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filterBy, setFilterBy] = useState<"all" | "assigned" | "created">(
    "all"
  );

  const handleTaskCreate = (status: keyof typeof taskStatuses) => {
    // TODO: Implement task creation functionality
    console.log("Create task with status:", status);
  };

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  const groupedTasks = Object.keys(taskStatuses).reduce(
    (acc, status) => {
      acc[status as keyof typeof taskStatuses] = filteredTasks.filter(
        (task) => task.status === status
      );
      return acc;
    },
    {} as Record<keyof typeof taskStatuses, Task[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Tasks</h1>
          <Badge variant="secondary">{filteredTasks.length} total</Badge>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {filterBy === "all"
                  ? "All tasks"
                  : filterBy === "assigned"
                    ? "Assigned to me"
                    : "Created by me"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterBy("all")}>
                All tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("assigned")}>
                Assigned to me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("created")}>
                Created by me
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => handleTaskCreate("backlog")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Board */}
      {/* Mobile View */}
      <div className="block sm:hidden space-y-4">
        {Object.entries(taskStatuses).map(([status]) => (
          <TaskColumn
            key={status}
            status={status as keyof typeof taskStatuses}
            tasks={groupedTasks[status as keyof typeof taskStatuses]}
            onTaskCreate={handleTaskCreate}
          />
        ))}
      </div>

      {/* Desktop/Tablet View */}
      <div className="hidden sm:flex gap-4 lg:gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {Object.entries(taskStatuses).map(([status]) => (
          <TaskColumn
            key={status}
            status={status as keyof typeof taskStatuses}
            tasks={groupedTasks[status as keyof typeof taskStatuses]}
            onTaskCreate={handleTaskCreate}
          />
        ))}
      </div>
    </div>
  );
}
