import { Router } from "express";
import { auth, type authreqtype } from "./middleware/auth.js";
import pool from "../db.js";

export const messageRouter = Router()

messageRouter.get("/:roomId",auth,async(req:authreqtype,res)=>{
    //get all message in this room
    const room_id = req.params.roomId
    const user_id = req.user_id
    const IsUserJoinRoom = await pool.query("SELECT 1 FROM room_members WHERE member_id =$1 AND room_id = $2 ",[user_id,room_id])
    if(IsUserJoinRoom.rowCount===0){
        return res.status(401).json({
            message : "you are not in this room Dont do this BROO!"
        })
    }
    const allMessages = await pool.query("SELECT * FROM messages WHERE room_id = $1 ",[room_id]) 

    res.json({
        message :"Here are All messages",
        data : allMessages.rows
    })
})