import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from "hono/jwt";
import { createPostInput, updatePostInput} from "@kaushik_gtm/medium-common-2";

 export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
  Variables: {
      userId: string

  }
}>();

blogRouter.use("/*", async (c, next)=>{
 const autherHeader =  c.req.header("authorization") || "";
 const user = await verify(autherHeader, c.env.JWT_SECRET);
 if(user){
     await next();
 }else {
      c.status(403);
      c.json({message: " Invalid"})
 }
});
blogRouter.post('/', async (c) => {
	const userId = c.get('userId');
	const body = await c.req.json();
	const success = createPostInput.safeparse(body);
	if(!success){
		c.status(411)
		return c.json({message: "Invalid input"})
	}
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: userId
		}
	});
	return c.json({
		id: post.id
	});
})
blogRouter.put('/', async (c) => {
	const userId = c.get('userId');
	const body = await c.req.json();
	const success = updatePostInput.safeparse(body);
	if(!success){
		c.status(411);
		return c.json({message: "invalid user input"});
	}
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	prisma.post.update({
		where: {
			id: body.id,
			authorId: userId
		},
		data: {
			title: body.title,
			content: body.content
		}
	});

	return c.text('updated post');
});
blogRouter.get('/:id', async (c) => {
	const id = c.req.param('id');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const post = await prisma.post.findUnique({
		where: {
			id
		}
	});

	return c.json(post);
})
blogRouter.get('/bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	const posts = await prisma.post.findMany({});

	return c.json(posts);
})

