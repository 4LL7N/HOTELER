import { Request, Response } from "express"
import prisma from "../prismaClient"
import { PrismaClientInitializationError } from "@prisma/client/runtime/library"
import { comparePasswords, createJWT, hashPassword } from "../modules/auth"

export const createUser = async (
    req: Request & {
        body: {
            email: string,
            password: string,
            role: string,
        }
    },
    res: Response
) => {
    const {
        email,
        password,
        role,
    }: {
        email: string,
        password: string,
        role: "USER" | "ADMIN",
    } = req.body;

    try {
        const user = await prisma.user.create({
            data: {
                email,
                password: await hashPassword(password),
                role,
            }
        });
        const token = createJWT(user);
        res.status(201).json({ message: "User created successfully!", token });

    }catch(err) {
        if(err instanceof PrismaClientInitializationError) {
            res.status(400).json({ message: "User already exists"});
        }
        res.status(500).json({ message: "Internal Server Error"});
    }
}

export const login = async(
    req: Request & {
        body: {
            email: string,
            password: string,
        },
    },
    res: Response
) => {
    const { email, password }: { email: string, password: string } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if(!user) {
            res.status(401).json({ message: "Invalid Credentials" });
            return;
        }

        const isValidUser = await comparePasswords(password, user.password);

        if(!isValidUser) {
            res.status(401).json({ message: "Invalid Credentials" });
        }

        const token = createJWT(user);
        res.status(200).json({ 
            message: "Signed in succesfully!",
            token,
        });
    }catch(err) {
        if(err instanceof PrismaClientInitializationError) {
            res.status(400).json({ message: "Invalid Credentials" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
}