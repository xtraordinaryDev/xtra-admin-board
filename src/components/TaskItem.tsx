import type { Task } from "@/lib/data";
import { KIND_LABEL, PILLAR_LABEL } from "@/lib/playbook";
import { setTaskStatus, deleteTask } from "@/app/actions";

export function TaskItem({
  task,
  canEdit,
  showAssignee,
}: {
  task: Task;
  canEdit: boolean;
  showAssignee?: boolean;
}) {
  const cls = task.status === "done" ? "task-done" : task.status === "skipped" ? "task-skipped" : "";
  return (
    <li className={`flex gap-3 border-b border-line py-3 last:border-0 ${cls}`}>
      <form action={setTaskStatus} className="pt-0.5">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="status" value={task.status === "done" ? "todo" : "done"} />
        <button
          aria-label={task.status === "done" ? "Mark not done" : "Mark done"}
          className={`h-5 w-5 rounded border ${
            task.status === "done" ? "border-gold bg-gold text-ink" : "border-line-strong bg-white"
          } text-xs font-bold`}
        >
          {task.status === "done" ? "✓" : ""}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="task-title font-semibold">{task.title}</span>
          {showAssignee && <span className={`tag ${task.assignee === "owner" ? "tag-dark" : "tag-gold"}`}>{task.assignee === "owner" ? "Xavier" : "VA"}</span>}
          <span className="tag">{KIND_LABEL[task.kind] || task.kind}</span>
          {task.pillar && <span className="tag tag-gold">{PILLAR_LABEL[task.pillar] || task.pillar}</span>}
          {task.source === "ai" && <span className="tag">AI</span>}
          {task.source === "manual" && <span className="tag">Added</span>}
        </div>
        {task.detail && <p className="mt-1 whitespace-pre-line text-sm text-muted">{task.detail}</p>}
        <div className="mt-1 flex gap-3 text-xs">
          {task.status !== "skipped" ? (
            <form action={setTaskStatus}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="status" value="skipped" />
              <button className="text-muted underline">Skip</button>
            </form>
          ) : (
            <form action={setTaskStatus}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="status" value="todo" />
              <button className="text-muted underline">Un-skip</button>
            </form>
          )}
          {canEdit && task.source !== "routine" && (
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <button className="text-danger underline">Delete</button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
