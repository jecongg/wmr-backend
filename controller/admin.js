const {
    Admin
} = require("../models/admin")

const {QueryTypes} = require("sequelize")

const getAllUsers = async (req, res) =>{
    try{
        const query = req.query
        const users = await Admin.findAll("SELECT * FROM admin", {
            type: QueryTypes.SELECT
        })

        console.log(users)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}