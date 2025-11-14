"use client";

import { useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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

function TaskCard({
  task,
  onStatusUpdate,
}: {
  task: Task;
  onStatusUpdate: (
    taskId: number,
    newStatus: keyof typeof taskStatuses
  ) => void;
}) {
  const statusConfig =
    taskStatuses[task.status as keyof typeof taskStatuses] ||
    taskStatuses.backlog;
  const priorityStyle =
    priorityConfig[task.priority as keyof typeof priorityConfig] ||
    priorityConfig.medium;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn("w-2 h-2 rounded-full", statusConfig.dotColor)}
            />
            <h3 className="font-medium text-sm line-clamp-2 flex-1">
              {task.title}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(taskStatuses).map(([status, config]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() =>
                    onStatusUpdate(task.id, status as keyof typeof taskStatuses)
                  }
                  className="flex items-center gap-2"
                >
                  <config.icon className="h-4 w-4" />
                  {config.label}
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs px-2 py-0", priorityStyle.color)}
            >
              {priorityStyle.label}
            </Badge>
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          {task.assignedTo && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {task.assignedTo.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskColumn({
  status,
  tasks,
  onTaskUpdate,
  onTaskCreate,
}: TaskColumnProps) {
  const statusConfig = taskStatuses[status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex-1 min-w-80">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-medium text-sm">{statusConfig.label}</h2>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTaskCreate(status)}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onStatusUpdate={onTaskUpdate} />
        ))}

        {tasks.length === 0 && (
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
  onTaskUpdate: (taskId: number, newStatus: keyof typeof taskStatuses) => void;
  onTaskCreate: (status: keyof typeof taskStatuses) => void;
}

export function LinearTaskBoard({
  tasks,
  onTaskUpdate,
  onTaskCreate,
}: LinearTaskBoardProps) {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filterBy, setFilterBy] = useState<"all" | "assigned" | "created">(
    "all"
  );

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

          <Button size="sm" onClick={() => onTaskCreate("backlog")}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Task Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.entries(taskStatuses).map(([status]) => (
          <TaskColumn
            key={status}
            status={status as keyof typeof taskStatuses}
            tasks={groupedTasks[status as keyof typeof taskStatuses]}
            onTaskUpdate={onTaskUpdate}
            onTaskCreate={onTaskCreate}
          />
        ))}
      </div>
    </div>
  );
}
