export class Queue {
    offset = 0
    map = new Map()

    get length() {
        return this.map.size
    }

    enqueue(item: any) {
        const current = this.offset + this.length
        this.map.set(current, item)
    }

    dequeue() {
        if(this.length > 0) {
            const value = this.map.get(this.offset)
            this.map.delete(this.offset++)

            return value
        }
    }

    unshift(...items: any[]) {
        let offset = this.offset - items.length
        this.offset = offset
        
        for(const item of items) {
            this.map.set(offset++, item)
        }
    }
}