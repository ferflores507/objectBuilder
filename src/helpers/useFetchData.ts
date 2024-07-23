function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const jsonOrString = (str) => {
    if(isJsonString(str) === false){
        return str
    }

    return JSON.parse(str)
}

export default function useFetchData() {
    
    const fetchData = async (url: string, opciones, signal: AbortSignal) => {
        
        console.log("Haciendo fetch con:", { url, opciones })

        // if(opciones.method === "get"){
        //     opciones.body = undefined
        // }

        const res = await fetch(url, { ...opciones, signal })
        const respuesta = await res.text()
        const { ok, status } = res

        return { ok, status, data: jsonOrString(respuesta) }
    }

    return {
        fetchData
    }
}