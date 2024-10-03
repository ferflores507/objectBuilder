export class TaskBuilder {
    target: any
    tasks: any[] = []

    with({ target } : { target: any }) {
        this.target = target

        return this
    }

    add(task: (target: any) => any) {
        this.tasks.push(task)

        return this
    }

    build() {
        return this.tasks.reduce((target, task) => {
            const value = task(target)

            return typeof value?.then === "function"
                ? target 
                : value

        }, this.target)
    }

    async buildAsync() {
        try {
            let target = this.target
            
            for(const task of this.tasks) {
                target = await task(target)
            }

            return target
        }
        catch (ex) {
            // this.setStatus({ error })
            // this.with({ target: ex }).withSchema(errorSchema).build()
        }
        finally {
            // this.setStatus({ loading: false })
        }
    }
}