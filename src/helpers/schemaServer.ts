import { createServer, IncomingMessage, ServerResponse } from "http"

const port = process.env.PORT || 8000;

type HandlerMiddleWare = (path: string, res: ServerResponse, payload: any) => void
const sleep = () => new Promise(resolve => {
    setTimeout(resolve, 200)
})

const useRouter = () => {

    type RouteHandler = Record<string, (res: ServerResponse, payload: any) => void>

    const handlers: RouteHandler = {
        "/": (res) => {
            res.write("Home handler");
        },
        "/message": (res) => {
            res.write("Message handler");
        },
        "/numeros": (res) => {
            const value = JSON.stringify([...Array(10).keys()])
            res.end(value)
        }
    }

    const failed = (path: string, res: ServerResponse) => {
        res.writeHead(404)
        res.end("No se encontro la ruta: " + path)
    }
    
    const route: HandlerMiddleWare = async (path, res, payload) => {
        console.log({ path })
        await sleep()
        const handler = handlers[path]

        handler ? handler(res, payload) : failed(path, res)
    }

    return {
        route
    }
}

function setUpServer(route: HandlerMiddleWare) {
    function handleReq(req: IncomingMessage, res: ServerResponse) {
        const path = req.url ?? "/"; // null check debido a que el tipo permite "undefined"
        let payload = "";

        req.on("data", (chunk) => {
            console.log("data recibida:", { chunk })
            payload += chunk;
        });

        req.on("end", async () => {
            await route(path, res, payload)
            res.end();
        });
    }
    return createServer(handleReq);
}

const { route } = useRouter()

export const setupServer = () => {
    const server = setUpServer(route)
    return {
        listen: () => server.listen(port, () => console.log(`App running on port ${port}`)),
        close: () => server.close()
    }
}