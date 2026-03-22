import { getDb } from '../../../dist/orchestrator/db.js';
export function insertTask(task) {
    getDb()
        .prepare(`INSERT INTO swe_queue
        (id, record_id, list_id, thread_jid, task_type, description, status, pr_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(task.id, task.record_id, task.list_id, task.thread_jid, task.task_type, task.description, task.status ?? 'pending', task.pr_url ?? null);
}
export function getNextPendingTask() {
    return getDb()
        .prepare(`SELECT * FROM swe_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1`)
        .get();
}
export function activateTask(id, timeoutMinutes = 30) {
    getDb()
        .prepare(`UPDATE swe_queue
       SET status = 'active',
           started_at = datetime('now'),
           timeout_at = datetime('now', '+' || ? || ' minutes')
       WHERE id = ?`)
        .run(timeoutMinutes, id);
}
export function completeTask(id, prUrl) {
    getDb()
        .prepare(`UPDATE swe_queue
       SET status = 'done',
           completed_at = datetime('now'),
           pr_url = COALESCE(?, pr_url)
       WHERE id = ?`)
        .run(prUrl ?? null, id);
}
export function failTask(id) {
    getDb()
        .prepare(`UPDATE swe_queue
       SET status = 'failed',
           completed_at = datetime('now')
       WHERE id = ?`)
        .run(id);
}
export function getTimedOutTasks() {
    return getDb()
        .prepare(`SELECT * FROM swe_queue WHERE status = 'active' AND timeout_at < datetime('now')`)
        .all();
}
export function hasActiveTask() {
    const row = getDb()
        .prepare(`SELECT COUNT(*) as count FROM swe_queue WHERE status = 'active'`)
        .get();
    return row.count > 0;
}
//# sourceMappingURL=queue-db.js.map