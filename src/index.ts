import { WebSocketServer ,WebSocket } from 'ws'
interface messageType {
    username : string,
    message : string
}
interface User {
    socket: WebSocket;
    roomID :string
}
type ParseMessage = {
      type: "join";
      payload: {
          roomID: string;
          roomName : string;
          username: string;
          time: number;
      };
    }  | {
      type: "chat";
      payload: {
        message: string; 
        username: string;
        time: number;
        roomID : string;
      };
    };
const wss = new WebSocketServer ({port :8080})
const messages:messageType[]  = []
let AllSocket :User[]=[]
wss.on("connection",function(socket){
    console.log("user Connected")
    
    socket.on("message",(data)=>{
        const parsed :ParseMessage =JSON.parse(data.toString())
        if(parsed.type === "join"){
            const alreadyjoinsameroom = AllSocket.find(
                (u)=>u.socket ===socket && u.roomID === parsed.payload.roomID )
                if(alreadyjoinsameroom){
                    console.log("User Aready in this room ")
                    socket.send('You are Aready in this room')
                    return 
                }
                AllSocket.push({
                    socket,
                    roomID :parsed.payload.roomID 
                })
                console.log(AllSocket.length)
            }if(parsed.type === "chat"){
                const isCurrectroomId = AllSocket.find(
                    x=>x.socket  ===socket && parsed.payload.roomID === x.roomID)
                if(!isCurrectroomId){
                    socket.send("You are not in the room")
                    return
                }
                const currentuserRoom = parsed.payload.roomID
                console.log(` room ${currentuserRoom} `)
                const roomSocket= AllSocket.filter((User)=> User.roomID===currentuserRoom)

            roomSocket.forEach(x=> x.socket.send(JSON.stringify(parsed.payload)))
        }
       
    })
    socket.on("close",()=>{
        console.log("user Disconect")
        AllSocket = AllSocket.filter((u) => u.socket !== socket)
    })
})
