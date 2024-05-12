const http = require('http');
const fs = require('fs');
const Koa = require('koa');
const Router = require('koa-router');
const cors = require('koa2-cors');
const koaBody = require('koa-body');

const categories = JSON.parse(fs.readFileSync('./data/categories.json'));
const items = JSON.parse(fs.readFileSync('./data/products.json'));
const topSaleIds = [66, 65, 73];
const moreCount = 6;


////
let nextId = 1
const skills = [
    { id: nextId++, name: "React" },
    { id: nextId++, name: "Redux" },
    { id: nextId++, name: "Redux Thunk" },
    { id: nextId++, name: "RxJS" },
    { id: nextId++, name: "Redux Observable" },
    { id: nextId++, name: "Redux Saga" },
]
/////

const itemBasicMapper = item => ({
    id: item.id,
    category: item.category,
    title: item.title,
    price: item.price,
    images: item.images,
});

const randomNumber = (start, stop) => {
    return Math.floor(Math.random() * (stop - start + 1)) + start;
}

const fortune = (ctx, body = null, status = 200) => {
    // Uncomment for delay
    // const delay = randomNumber(1, 10) * 500;
    const delay = 0;
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            //Uncomment for error generation
            // if (Math.random() > 0.8) {
            //     reject(new Error('Something bad happened'));
            //     return;
            // }

            ctx.response.status = status;
            ctx.response.body = body;
            resolve();
        }, delay);
    })
}

const app = new Koa();
app.use(cors());
app.use(koaBody({
    json: true
}));

const router = new Router();
let isEven = true
router.get('/api/search', async (ctx, next) => {
    if (Math.random() > 0.75) {
        ctx.response.status = 500
        return
    }
    const { q } = ctx.request.query

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const response = skills.filter(
                o => o.name.toLowerCase().startsWith(q.toLowerCase())
            )
       
            ctx.response.body = response
            resolve()
        }, isEven ? 1 * 1000 : 5 * 1000)
        isEven = !isEven
    });
});

router.get('/api/top-sales', async (ctx, next) => {
    return fortune(ctx, items.filter(o => topSaleIds.includes(o.id)).map(itemBasicMapper));
});

router.get('/api/categories', async (ctx, next) => {
    return fortune(ctx, categories);
});

router.get('/api/items', async (ctx, next) => {
    const { query } = ctx.request;

    const categoryId = query.categoryId === undefined ? 0 : Number(query.categoryId);

    const offset = query.offset === undefined ? 0 : Number(query.offset);
    const q = query.q === undefined ? '' : query.q.trim().toLowerCase();

    const filtered = items
        .filter(o => categoryId === 0 || o.category === categoryId)
        .filter(o => o.title.toLowerCase().includes(q) || o.color.toLowerCase() === q)
        .slice(offset, offset + moreCount)
        .map(itemBasicMapper);

    return fortune(ctx, filtered);
});

router.get('/api/items/:id', async (ctx, next) => {
    const id = Number(ctx.params.id);
    const item = items.find(o => o.id === id);
    if (item === undefined) {
        return fortune(ctx, 'Not found', 404);
    }

    return fortune(ctx, item);
});

router.post('/api/order', async (ctx, next) => {
    const { owner: { phone, address }, items } = ctx.request.body;

    if (typeof phone !== 'string') {
        return fortune(ctx, 'Bad Request: Phone', 400);
    }
    if (typeof address !== 'string') {
        return fortune(ctx, 'Bad Request: Address', 400);
    }
    if (!Array.isArray(items)) {
        return fortune(ctx, 'Bad Request: Items', 400);
    }
    if (!items.every(({ id, price, count }) => {
        if (typeof id !== 'number' || id <= 0) {
            return false;
        }
        if (typeof price !== 'number' || price <= 0) {
            return false;
        }
        if (typeof count !== 'number' || count <= 0) {
            return false;
        }
        return true;
    }
    )) {
        return fortune(ctx, 'Bad Request', 400);
    }

    return fortune(ctx, null, 204);
});

app.use(router.routes())
app.use(router.allowedMethods());

const port = process.env.PORT || 7070;
console.log('port',port)
const server = http.createServer(app.callback());
server.listen(port);