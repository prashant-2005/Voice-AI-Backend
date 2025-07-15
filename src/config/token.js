import jwt from "jsonwebtoken";

const genToken = (userId) => {
    try {
        const token = jwt.sign({id:userId},process.env.JWT_SECRETKEY,{expiresIn:"7d"})
        return token
    } catch (error) {
        console.log(error);  
    }
}

export default genToken 
