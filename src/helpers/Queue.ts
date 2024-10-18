export class Queue {
    offset = 0
    map = new Map()

    enqueue(item: any) {
        const current = this.offset + this.map.size
        this.map.set(current, item)
    }

    dequeue() {
        if(this.map.size > 0) {
            const value = this.map.get(this.offset)
            this.map.delete(this.offset++)

            return value
        }
    }
}