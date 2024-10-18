export class Queue {
    offset = 0
    map = new Map()

    get length() {
        return this.map.size
    }

    set(offset: number, ...items: any[]) {
        for(const item of items) {
            this.map.set(offset++, item)
        }
    }

    enqueue(...items: any[]) {
        const offset = this.offset + this.length
        this.set(offset, ...items)
    }

    dequeue() {
        if(this.length > 0) {
            const value = this.map.get(this.offset)
            this.map.delete(this.offset++)

            return value
        }
    }

    unshift(...items: any[]) {
        this.offset = this.offset - items.length
        this.set(this.offset, ...items)
    }
}