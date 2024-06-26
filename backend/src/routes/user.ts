import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from "hono/jwt"

import { signupInput, signinInput } from "@kaushik_gtm/medium-common-2"

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }    
}>()

userRouter.post('/signup', async(c) => {
      const body = await c.req.json()
      const success = signupInput.safeparse(body);
      if(!success){
        c.status(411)
        c.json({message: "Inputs not correct"})
      }
      const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
      }).$extends(withAccelerate())
    
      try {
       await prisma.user.create({
          data: {
            email: body.email ,
            password: body.password,
            name: body.name
          }
        }); 
           const jwt = await sign({id: body.id}, c.env.JWT_SECRET);
    
        return c.text(jwt);
      } catch(e){
        c.status(411)
        c.text("user already exist")
      }
    
    })

userRouter.post('/signin', async(c) => {
      const body = await c.req.json()
      const success = signinInput.safeparse(body);
      if(!success){
        c.status(411)
        c.json({message: "Inputs not correct"})
      }
      const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
      }).$extends(withAccelerate())
    
      try {
      const user = await prisma.user.findFirst({
          where: {
            email: body.email ,
            password: body.password,
            name: body.name
          }
        }); 
          if(!user){
            c.status(411);
            return c.json({ message: "Incorrect crenditial"});
          }
           const jwt = await sign({id: body.id}, c.env.JWT_SECRET);
    
        return c.text(jwt);
      } catch(e){
        c.status(411)
        c.text("user already exist")
      }
    
    })