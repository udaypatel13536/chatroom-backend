import { WebSocketServer ,WebSocket } from 'ws'
interface messageType {
    username : string,
    message : string
}
const wss = new WebSocketServer ({port :8080})
    let AllSocket :WebSocket[]=[]
    const messages:messageType[]  = []
wss.on("connection",function(socket){
    AllSocket.push(socket)

    console.log("user Connected")
    socket.on("message",(data)=>{
        const parsed :messageType =JSON.parse(data.toString())
        messages.push(parsed)
       for(let i=0 ; i < AllSocket.length ; i++){
        const  s = AllSocket[i]
        s!.send(JSON.stringify(parsed))
       }
    })
    socket.on("close",()=>{
        console.log("user Disconect")
        AllSocket = AllSocket.filter(x =>x !== socket)
    })

})
