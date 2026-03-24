import type { WebSocketServer } from "ws";
import type { customReqtype } from "./index.js";
import WebSocket from "ws";
import pool from "./db.js";
import { v4 as uuidv4 } from 'uuid';

const rooms = new Map<string,Set<WebSocket>>()

export function wsHandler(ws: WebSocket, req: customReqtype, wss: WebSocketServer){

  const username = req.user?.username;
  const userId = req.user?.user_id
  const roomId = req.roomId;    

    if(!rooms.has(roomId!)){
         rooms.set(roomId!,new Set())
    }
    const room = rooms.get(roomId!)!.add(ws)

function broadcast(roomId:string, payload:any,excluded?:WebSocket) {
  const clients = rooms.get(roomId);
  if (!clients) return;
  const json = JSON.stringify(payload);

  clients.forEach((client) => {
    if(client===excluded){
      return;
    }
      client.send(json);
  });
}
broadcast(roomId!, { type: 'user_joined', user: { userId, username } });

ws.on('message', async (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); }
    catch { return ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' })); }
    const content = data.text?.trim();
    if (!content) {
        return ws.send(JSON.stringify({
            type: "error",
            message :"Emty message"
        }))
    }
    const id = uuidv4();
    try {
        await pool.query(`INSERT INTO messages (message_id , room_id, sender_id, content) VALUES ($1, $2, $3, $4)`,[id, roomId, userId, content]);
    } catch (e) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Failed to save message' }));
    }
        
    broadcast(roomId!, {
          type: 'new_message',
          message: {
            id, roomId: roomId, content,
            type: 'text',
            createdAt: new Date().toISOString(),
            sender: { userId, username}
    }
        });
    
  });

  ws.on("close",()=>{
    const client = rooms.get(roomId!)?.delete(ws) 
    broadcast(roomId!,{type:"user_left",user:{userId,username}})
  })

}