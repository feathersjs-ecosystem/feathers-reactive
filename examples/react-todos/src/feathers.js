const io = require('socket.io-client');
const socketio = require('@feathersjs/socketio-client');
const feathers = require('@feathersjs/feathers');
const rx = require('feathers-reactive/dist/feathers-reactive');

const socket = io('http://localhost:3030');
const app = feathers()
  .configure(socketio(socket))
  .configure(rx({
    idField: 'id'
  }));

export default app;
