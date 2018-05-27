const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio');
const memory = require('feathers-memory');

const app = feathers()
  .configure(socketio())
  .use('/todos', memory());

app.on('connection', connection => app.channel('everybody').join(connection));
app.publish(() => app.channel('everybody'));

app.listen(3030).on('listening', () =>
  console.log('Feathers Socket.io server running on localhost:3030')
);
