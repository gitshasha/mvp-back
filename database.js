const Pool=require("pg").Pool
const pool=new Pool({
    host:"localhost",
    user:"postgres",
    port:5432,
    password:"Konnichiwa@123",
    database:"School_db"
})
module.exports=pool; 