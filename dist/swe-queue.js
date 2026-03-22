import { getNextPendingTask, activateTask, completeTask, failTask, getTimedOutTasks, hasActiveTask, } from './queue-db.js';
import { logger } from '../../../dist/orchestrator/logger.js';
const SWE_POLL_INTERVAL = 30_000;
const SWE_TIMEOUT_MINUTES = 30;
export async function processSweQueue(deps) {
    const timedOut = getTimedOutTasks();
    for (const task of timedOut) {
        logger.warn({ taskId: task.id }, 'SWE task timed out');
        failTask(task.id);
        await deps.sendMessage(task.thread_jid, 'SWE task timed out');
    }
    if (hasActiveTask())
        return;
    const task = getNextPendingTask();
    if (!task)
        return;
    const ctx = {
        id: task.id,
        recordId: task.record_id,
        listId: task.list_id,
        threadJid: task.thread_jid,
        taskType: task.task_type,
        description: task.description,
    };
    activateTask(task.id, SWE_TIMEOUT_MINUTES);
    await deps.sendMessage(task.thread_jid, `Starting ${task.task_type} work: ${task.description}`);
    logger.info({ taskId: task.id, taskType: task.task_type }, 'Starting SWE task');
    try {
        const result = await deps.runSweAgent(ctx);
        completeTask(task.id, result.prUrl);
        const message = result.prUrl
            ? `SWE task complete. PR: ${result.prUrl}`
            : 'SWE task complete.';
        await deps.sendMessage(task.thread_jid, message);
        logger.info({ taskId: task.id, prUrl: result.prUrl }, 'SWE task completed');
    }
    catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.error({ taskId: task.id, error }, 'SWE task failed');
        failTask(task.id);
        await deps.sendMessage(task.thread_jid, `SWE task failed: ${error}`);
    }
}
let sweQueueRunning = false;
export function startSweQueueLoop(deps) {
    if (sweQueueRunning)
        return;
    sweQueueRunning = true;
    logger.info('SWE queue loop started');
    const loop = async () => {
        try {
            await processSweQueue(deps);
        }
        catch (err) {
            logger.error({ err }, 'Error in SWE queue loop');
        }
        setTimeout(loop, SWE_POLL_INTERVAL);
    };
    loop();
}
export function _resetSweQueueLoopForTests() {
    sweQueueRunning = false;
}
//# sourceMappingURL=swe-queue.js.map