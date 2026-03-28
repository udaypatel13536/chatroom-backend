import type { WebSocketServer } from "ws";
import type { customReqtype } from "./index.js";
import WebSocket from "ws";
import pool from "./db.js";
import { v4 as uuidv4 } from 'uuid';
import { group } from "console";

const userSockets = new Map<string,WebSocket>()
const groupMember = new Map<string,Set<string>>()

function onDisconnect(user_id:string){
  userSockets.delete(user_id)

  groupMember.forEach((member,groupId)=>{
    member.delete(user_id)
    if(member.size===0)groupMember.delete(groupId)
  })
 }

 function subcribeToGroup(user_id :string,group_id :string){
  if(!groupMember.has(group_id)) groupMember.set(group_id,new Set())
  groupMember.get(group_id)?.add(user_id)

 }
 
 function broadcast(members : Set<string>, payload:any,excluded?:WebSocket) {
   
   if (!members) return;
   const data = JSON.stringify(payload);
 
   members.forEach((member) => {
     const socket = userSockets.get(member)
     if(socket === excluded){
       return;
     }
     if(socket?.readyState===WebSocket.OPEN)
       socket.send(data)
   })
 }

  async function OnConnect(userId :string,ws:WebSocket){
    userSockets.set(userId,ws)

    const user_in_groups = await pool.query("SELECT rooms.* FROM rooms JOIN room_members ON rooms.room_id = room_members.room_id  WHERE room_members.member_id = $1",[userId])
    if(user_in_groups.rowCount===0){
      return 
    }
    console.log(user_in_groups.rows)
    user_in_groups.rows.forEach((row)=>{
      const room_id  = row.room_id
      if(!groupMember.has(room_id))
        groupMember.set(room_id,new Set())
      groupMember.get(room_id)?.add(userId)
      console.log(
  "group room_id Set:",
  Array.from(groupMember.get(room_id) || [])
);
  })
  }

export async function  WSHendler (ws: WebSocket, req: customReqtype, wss: WebSocketServer){
  const username = req.user?.username;
  const userId = req.user?.user_id
  console.log(` userId : ${userId}`)
 await OnConnect(userId!,ws)
 ws.on('message',async(raw)=>{
  const data = JSON.parse(raw.toString())
//data ={type , room_id ,text }
  switch(data.type){
    case 'send_message' :{
      const members = groupMember.get(data.room_id)
      console.log("members :" + Array.from(members!)||[])
      if(!members?.has(userId!)){
        ws.send(JSON.stringify({type :'error',message :"You are Not found of this group member"}))
        break
      }
      const content = data.text?.trim();
      if (!content) {
         ws.send(JSON.stringify({
            type: "error",
            message :"Emty message"
        }))
        break
    }
      const message_id = uuidv4()
     try {
        await pool.query(`INSERT INTO messages (message_id , room_id, sender_id, content) VALUES ($1, $2, $3, $4)`,[message_id, data.room_id, userId, content]);
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to save message' }));
        break
      }
      broadcast(members, {
        type :'New_message',
        group_id :data.room_id,
        message :{
          message_id : message_id,
          sender: {userId,username},
          created_at : new Date().toISOString()
        }
      })
      break
    }
    case 'Join_group' :{
      subcribeToGroup(userId!,data.room_id)
      ws.send(JSON.stringify({
        type: 'joined', groupId: data.room_id
      }))
      break
    }
  }
 })
 
ws.on("close",()=>{
  onDisconnect(userId!)
})

}