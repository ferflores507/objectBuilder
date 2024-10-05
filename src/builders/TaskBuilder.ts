type Task = (current: any, previous: any) => any

export class TaskBuilder {
    target: any
    tasks: any[] = []
    errorTasks: any[] = []
    cleanupTasks: any[] = []

    with({ target = this.target, tasks = [] } : { target?: any, tasks: any[] }) {
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

    addTo(task: Task, tasks: Task[]) {
        tasks.push(task)

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
        return this.tasks.reduce((target, task) => {
            const value = task(target, this.target)

            return typeof value?.then === "function"
                ? target 
                : value

        }, this.target)
    }

    build() {
        try {
            return this.buildSyncTasks()
        }
        catch {
            this.doErrorTasks()
        }
        finally {
            // this.cleanup()
        }
    }

    async buildAsync() {
        try {
            let target = this.target
            
            for(const task of this.tasks) {
                target = await task(target, this.target)
            }

            return target
        }
        catch (ex) {
            this.doErrorTasks()
        }
        finally {
            this.cleanup()
        }
    }
}