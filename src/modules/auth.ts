import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"


export const hashPassword = (password: string) => {
    return bcrypt.hash(password, 10);
}

export const createJWT = (user: {
    id: string,
    email: string,
}) => {
    if(!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET
    );

    return token;
}