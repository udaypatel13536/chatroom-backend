import {Pool} from 'pg'
import fs from 'fs'

const pool = new Pool({
    connectionString: "postgresql://postgres:chatapp123@localhost:5432/postgres",
})
export default pool
export async function test(){
    const res =  await pool.query("SELECT NOW()")
    console.log(res.rows)

}
export async function initDB(){
    const sql = fs.readFileSync("./src/initDB.sql","utf-8")
    await pool.query(sql)
    console.log("table initilized")
}