import { Router } from "express";
import { auth, type authreqtype } from "./middleware/auth.js";
import { v4 as uuidv4 } from 'uuid';
import pool from "../db.js";

export const roomRouter = Router()
roomRouter.get("/",async(req,res)=>{
//get all room list 
const allRoom = await pool.query("SELECT * FROM rooms WHERE is_private = false")
return res.json({
    message :"All room ",
    data : allRoom.rows
})
})

roomRouter.get("/my",auth,async(req:authreqtype,res)=>{
 //get only join room list  $ 
 const user_id = req.user_id
 const userInAllRoom = await pool.query("SELECT rooms.* FROM rooms JOIN room_members ON rooms.room_id = room_members.room_id  WHERE room_members.member_id = $1",[user_id]) 
 res.json({
    message : "you are in this room right now",
    data : userInAllRoom.rows
 })
 
})

roomRouter.post("/",auth,async(req:authreqtype,res)=>{
    //make room
    const username = req.username
const user_id = req.user_id
const name = req.body.name
const is_private = false
const room_id = uuidv4()
try{
    const samename = await pool.query("SELECT * FROM rooms WHERE name = $1",[name])
    if(samename.rowCount!==0){
        return res.status(403).json({
            message : "room name is already taken pls chathe room name."
        })
    }
    const role :string = 'admin'
    const client = await pool.connect()
    try{
        await client.query("BEGIN")
        const roomsRes = await client.query("INSERT INTO rooms (room_id , name , is_private , created_by )  VALUES ($1,$2,$3,$4) RETURNING name , room_id , created_by ",[room_id,name,is_private,user_id])
        const memberRes = await client.query("INSERT INTO room_members (room_id , member_id , role ) VALUES ($1,$2,$3) RETURNING * ",[room_id,user_id,role])
        await client.query("COMMIT")
        res.json({
            message : "Room Creat successfully!",
            roomdata : roomsRes,
            memberdata : memberRes.rows
        })
    }catch(err){
        await client.query("ROLLBACK");
        res.status(500).json({
            message : "inter server Error ",
            err
        })
    }finally{
        client.release();
    }
    
}catch(err){
    return res.status(500).json({
        message: "Interner Server Error ",
        err
    })
}
})

roomRouter.post("/:roomId/join",auth,async(req:authreqtype,res)=>{
    //join the roomId room 
    const user_id = req.user_id
    const room_id = req.params.roomId
    const role :string = 'member'
    const isUserInRoom = await pool.query("SELECT 1 FROM room_members WHERE member_id = $1 AND room_id = $2 ",[user_id,room_id])
    if(isUserInRoom.rowCount!== 0 ){
        return res.json({
           message : "User is already in the room " 
        })
    }
    const addmemberinRoom = await pool.query("INSERT INTO room_members (room_id ,member_id, role ) VALUES ($1,$2,$3) RETURNING *",[room_id,user_id,role])
    res.json({
        meassage : "you join room susseccfully!",
        data : addmemberinRoom.rows[0]
    })
})


roomRouter.get("/:roomId/member",auth,async(req,res)=>{
    //get roomId all member $
    const room_id =req.params.roomId
    
    
    const isroomExist = await pool.query("SELECT * FROM rooms WHERE room_id = $1",[room_id])
    if(isroomExist.rowCount===0){
        return res.status(402).json({
            message : "room does not Exist"
        })
    }
    const roomMember = await pool.query("SELECT * FROM room_members WHERE room_id = $1",[room_id])
    return res.json({
        message :"Here is All member in room ",
        data : roomMember.rows
    })
})