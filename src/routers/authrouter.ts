import { Router } from "express";
import bcrypt from 'bcrypt'
import pool from "../db.js";
export const authRouter = Router()
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken'
import { JWT_PASSWORD } from "../config.js";


authRouter.post("/register",async(req,res)=>{
    const username  =  req.body.username 
    const password = req.body.password
    if(!username || !password){
        return res.status(411).json({
            message :"userName and Password required"
        })
    }
    const hashPassword =  await bcrypt.hash(password,10)
    const exists  = await pool.query("SELECT * FROM users WHERE username = $1",[username])
    if(exists.rowCount!==0){
        return res.status(400).json({
            message : "userName is Exists pls change it and try it again !"
        })
    }
    const user_id = uuidv4()
    const addUsers = await pool.query("INSERT INTO users (user_id , username , password) VALUES ($1,$2,$3) RETURNING username ,user_id ",[user_id,username,hashPassword])
    const jwt_Token = jwt.sign({user_id,username},JWT_PASSWORD)
    res.json({
        message: "User add successfully !",
        data : addUsers.rows,
        token :jwt_Token
    })
})

authRouter.post("/login",async(req,res)=>{
    const {username, password} = req.body
    if(!username || !password){
        return res.status(401).json({
            message :"username and password require!"
        })
    }
    const find_user= await pool.query("SELECT * FROM users WHERE username = $1",[username])

    if(find_user.rowCount===0){
        return res.status(401).json({
            message: "user not found !"
        }) 
    }
    const valid= await bcrypt.compare(password,find_user.rows[0].password) 
    if(!valid){
        return res.status(403).json({
            message : "incorect CREDS!"
        })
    }
    const user_id = find_user.rows[0].user_id
    const JWT_token = jwt.sign({user_id,username},JWT_PASSWORD)

    res.json({
        message :"You login successfully!",
        token : JWT_token,
        data : {username,user_id}
    })
})