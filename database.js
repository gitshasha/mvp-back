const Pool=require("pg").Pool
const pool = new Pool({
  //   host: "localhost",

  host: "aws-0-ap-south-1.pooler.supabase.com",
  //   user: "postgres",
  user: "postgres.evswsuuoxliplhvapvwt",
  //   port: 5432,
  port: 6543,

  password: "Konnichiwa@123",
  //   database: "School_db",

  database: "postgres",
});
module.exports=pool; 
