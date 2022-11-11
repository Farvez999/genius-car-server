const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());


const uri = "mongodb+srv://geniusDBUser:9zn90U9sHoP2QvJF@cluster0.mordayw.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('services');
        const ordersCollection = client.db('geniusCar').collection('orders');

        //JWT  Token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const query = { price: { $gt: 100, $lt: 300 } }
            const order = req.query.order === 'asc' ? 1 : -1;
            const cursor = serviceCollection.find(query).sort({ 'price': order });
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        //all order
        app.get('/orders', verifyJWT, async (req, res) => {

            //JWT  Token
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })
        //orders apo create data
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result);
        })

        //delete
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query)
            res.send(result);
        })

        //update
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: status
                }
            }
            const result = await ordersCollection.updateOne(query, updateDoc)
            res.send(result);
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Genius Car is Running')
})

app.listen(port, () => {
    console.log(`Genius car running on Server ${port}`);
})