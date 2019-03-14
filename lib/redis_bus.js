const redis = require("redis");

const redisConfig = {
    port: 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
}

class Channel
{
    constructor(name)
    {
        this.name = name;
        this.publisher = redis.createClient(redisConfig);
        this.listener = redis.createClient(redisConfig);
        this.subscriptions = [];
    }

    listen() {
        this.listener.subscribe(this.name);
        this.listener.on("message", handleMessage(this));
    }
}

const handleMessage = c => (channel, message) =>
{
    if(channel !== c.name)
        return;

    const msg = JSON.parse(message);
    c.subscriptions.forEach(subscription => subscription(msg));
};

const sendMessage = c => cmd =>
{
    let msg = JSON.stringify(cmd);
    c.publisher.publish(c.name, msg);
    console.log(`send ${msg} on ${c.name}`);
};

const onMessage = c => callback =>
{
    c.subscriptions.push(callback);
    console.log(`${c.name} message subscribers ${callback.length}`);
};

const Commands = new Channel("commands");
const Events = new Channel("events");

module.exports = {
    sendCommand: sendMessage(Commands),
    onCommand: onMessage(Commands),

    sendEvent: sendMessage(Events),
    onEvent: onMessage(Events)
}

Commands.listen();
Events.listen();
