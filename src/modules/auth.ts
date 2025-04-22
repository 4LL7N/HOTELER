import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { user } from "@prisma/client"
import { Request, Response, NextFunction } from "express";

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

export const comparePasswords = (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
}

declare module "express-serve-static-core" {
    interface Request {
        user: user;
    }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization;

    if(!bearer) {
        res.status(401).json({ message: "Not authorized" });
        return;
    }

    const [, token] = bearer.split(" ");

    try {
        if(!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        const user = jwt.verify(token, process.env.JWT_SECRET) as user;
        req.user = user;
        next();
    }catch(err) {
        if(err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Not a Valid Token Provided"});
        }
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
}