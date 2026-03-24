import type { NextFunction, Request, Response } from "express";
import type { authreqtype } from "./auth.js";

export async function in_Room(req:authreqtype,res:Response,next :NextFunction){
    const user_id= req.user_id
    const username = req.username
    
} 