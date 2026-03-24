import type { NextFunction,Request,Response } from "express";
import jwt from 'jsonwebtoken'
import { JWT_PASSWORD } from "../../config.js";


export interface authreqtype extends Request{
    user_id? : string
    username? : string
}

export async function auth(req :authreqtype ,res:Response,next:NextFunction){
    const token = req.headers.authorization
    if(!token){
        return res.status(403).json({
            message :"Token require in headers"
        })
    }
    try{
        const decoded:any = jwt.verify(token,JWT_PASSWORD)
        
        req.username = decoded.username
        req.user_id = decoded.user_id
        next()
    }catch(err){
        return res.status(401).json({
            message : "invelid token",
            err
        })
    }    
}