import express, { type Request } from 'express';
import http from 'http';

import { WebSocketServer } from 'ws';
import { authRouter } from './routers/authrouter.js';
import { roomRouter } from './routers/roomrouter.js';
import { messageRouter } from './routers/messagerouter.js';
import  url  from 'url';
import jwt, { type JwtPayload } from 'jsonwebtoken'

import { JWT_PASSWORD, PORT } from './config.js';
import type WebSocket from 'ws';

import { initDB, test } from './db.js';
import { WSHendler } from './wshandler.js';

export interface customReqtype extends Request{
    user?:{ user_id: string; username: string } 

 }

const app  = express()
const server = http.createServer(app)
const wss = new WebSocketServer({noServer :true})

app.use(express.json())

app.use("/api/auth",authRouter)
app.use("/api/room",roomRouter)
app.use("/api/messages",messageRouter)

server.on('upgrade',(req :customReqtype,socket,head)=>{
    const{query}= url.parse(req.url ,true) 
    const token = query.token as string;

    if(!token){
        socket.write("HTTP/1.1 400 Bed Request\r\n\r\n");
        socket.destroy()
    }
    try{
        const decoded = jwt.verify(token,JWT_PASSWORD) as {user_id: string; username: string;}
       
        req.user = decoded 


        wss.handleUpgrade(req,socket,head,(ws :WebSocket)=>{
            wss.emit("connection",ws,req)
        })
    }catch(err){
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
        socket.destroy()
    }
})

wss.on("connection",(ws : WebSocket,req:customReqtype)=>{
    ws.send(`you are connected.`)
    WSHendler(ws,req,wss)
})


server.listen(PORT,()=>{
    console.log(`server runing on ${PORT}`)
})

// async function serverStart(){
//     try{
//         await test()
//         await initDB()
//      
//     }catch(err){
//         console.error("error in test DB" ,err)
//     }
// }

// serverStart()