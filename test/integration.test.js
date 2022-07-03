import assert from 'assert';
import { feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';
import socketioClient from '@feathersjs/socketio-client';
import io from 'socket.io-client';
import memory from 'feathers-memory';
import rx from '../src';
import {
  take
} from 'rxjs/operators';

const app = feathers()
  .configure(socketio())
  .use('/todos', memory());

app.on('connection', connection => app.channel('everybody').join(connection));
app.publish(() => app.channel('everybody'));

describe('feathers-reactive integration', () => {
  before(async () => {
    await app.listen(3030);
  });

  it('works with a client Feathers app', (done) => {
    const socket = io('http://localhost:3030');
    const client = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));

    client.service('todos')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} }).pipe(take(1))
      .subscribe(messages => {
        assert.ok(messages);
        done();
      }, done);
  });
});
