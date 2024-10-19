import { Queue } from "../helpers/Queue"

export type Task = (current: any, previous: any) => any

export class TaskBuilder {
    target: any
    tasks: Queue = new Queue()
    errorTasks: Queue = new Queue()
    cleanupTasks: Queue = new Queue()

    with({ target = this.target, tasks = new Queue() } : { target?: any, tasks: Queue }) {
        this.target = target
        this.tasks = tasks

        return this
    }

    cleanup() {
        this.with({ tasks: this.cleanupTasks }).build()
    }

    doErrorTasks() {
        this.with({ tasks: this.errorTasks }).build()
    }

    addTo(task: Task, tasks: Queue) {
        tasks.enqueue(task)

        return this
    }

    merge() {
        return this.add(value => this.target = value)
    }

    add(task: Task) {
        return this.addTo(task, this.tasks)
    }

    addErrorTask(task: Task) {
        return this.addTo(task, this.errorTasks)
    }

    addCleanupTask(task: Task) {
        return this.addTo(task, this.cleanupTasks)
    }

    buildSyncTasks() {
        let target = this.target
        let currentTask = null

        while (currentTask = this.tasks.dequeue()) {
            const value = currentTask(target, this.target)
            const isAsync = value?.then === "function"

            target = isAsync ? target : value
        }

        return target
    }

    build() {
        try {
            return this.buildSyncTasks()
        }
        catch (e) {
            this.doErrorTasks()
            throw e
        }
        finally {
            // this.cleanup()
        }
    }

    async buildAsync() {
        try {
            let target = this.target
            let currentTask = null

            while(currentTask = this.tasks.dequeue()){
                target = await currentTask(target, this.target)
            }

            return target
        }
        catch (e) {
            this.doErrorTasks()
            throw e
        }
        finally {
            this.cleanup()
        }
    }
}