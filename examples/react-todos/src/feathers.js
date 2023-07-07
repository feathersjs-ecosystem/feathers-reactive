const socketio = require('@feathersjs/socketio-client');
const feathers = require('@feathersjs/feathers');
const feathersReactive = require('../../..');
const io = require('socket.io-client');

const socket = io('http://localhost:3030');
const app = feathers()
  .configure(socketio(socket))
  .configure(
    feathersReactive.rx({
      idField: 'id'
    })
  );

export default app;
