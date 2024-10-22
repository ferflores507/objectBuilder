import { Queue } from "../helpers/Queue"

export type Task = (current: any, previous: any) => any
export type AsyncTask = (current: any, previous: any) => Promise<any>
export type Builder = {
    build: Task
    buildAsync: AsyncTask
}

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

    getBuilder(task: Task | Builder) {
        return (task as Builder).build
            ? task
            : {
                build: task,
                buildAsync: task
            }
    }

    unshift(task: Task | Builder) {
        this.tasks.unshift(this.getBuilder(task))
    }

    unshiftAsync(task: AsyncTask) {
        this.tasks.unshift({ 
            build: (curr: any) => curr,
            buildAsync: task
        })
    }

    cleanup() {
        this.with({ tasks: this.cleanupTasks }).build()
    }

    doErrorTasks() {
        this.with({ tasks: this.errorTasks }).build()
    }

    merge() {
        return this.add(value => this.target = value)
    }

    add(task: Task) {
        this.tasks.enqueue(this.getBuilder(task))
    }

    addErrorTask(task: Task) {
        this.errorTasks.enqueue(task)
    }

    addCleanupTask(task: Task) {
        this.cleanupTasks.enqueue(task)
    }

    buildSyncTasks() {
        let target = this.target
        let currentTask = null

        while (currentTask = this.tasks.dequeue()) {
            target = currentTask.build(target, this.target)
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
                target = await currentTask.buildAsync(target, this.target)
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