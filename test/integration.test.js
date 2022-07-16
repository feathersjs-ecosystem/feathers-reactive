import assert from 'assert';
import { feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';
import socketioClient from '@feathersjs/socketio-client';
import io from 'socket.io-client';
import memory from 'feathers-memory';
import rx from '../src';

const app = feathers()
  .configure(socketio())
  .use('/messages', memory());

app.on('connection', connection => app.channel('everybody').join(connection));
app.publish(() => app.channel('everybody'));

describe('feathers-reactive integration', () => {
  before(async () => {
    await app.listen(3030);
  });

  it('works with a client Feathers app initiating service operations', async () => {
    const socket = io('http://localhost:3030');
    const client = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));

    let callCount = 0
    const listener = client.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} })
      .subscribe(messages => {
        assert.ok(messages);
        callCount++
      });
    await client.service('messages').create({
      text: 'A test message'
    });
    await client.service('messages').patch(0, {
      text: 'A patched test message'
    });
    await client.service('messages').update(0, {
      id: 0,
      text: 'An updated test message'
    });
    await client.service('messages').remove(0);
    listener.unsubscribe()
    // We should have 5 calls: first find + 4 events
    assert.equal(callCount, 5);
  }).timeout(5000);

  it('works with a client Feathers app listening for service operations', async () => {
    const socket = io('http://localhost:3030');
    const client = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));

    let callCount = 0
    const listener = client.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} })
      .subscribe(messages => {
        assert.ok(messages);
        callCount++
      });
    await app.service('messages').create({
      text: 'A test message'
    });
    await app.service('messages').patch(1, {
      text: 'A patched test message'
    });
    await app.service('messages').update(1, {
      id: 1,
      text: 'An updated test message'
    });
    await app.service('messages').remove(1);
    listener.unsubscribe()
    // We should have 5 calls: first find + 4 events
    assert.equal(callCount, 5);
  }).timeout(5000);

  it('works with multiple client Feathers apps', async () => {
    const socket = io('http://localhost:3030');
    const client1 = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));
    const client2 = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));

    let callCount1 = 0, callCount2 = 0
    const listener1 = client1.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} })
      .subscribe(messages => {
        assert.ok(messages);
        callCount1++
      });
    const listener2 = client2.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} })
      .subscribe(messages => {
        assert.ok(messages);
        callCount2++
      });
    await client1.service('messages').create({
      text: 'A test message'
    });
    await client1.service('messages').patch(2, {
      text: 'A patched test message'
    });
    await client2.service('messages').update(2, {
      id: 2,
      text: 'An updated test message'
    });
    await client2.service('messages').remove(2);
    listener1.unsubscribe()
    listener2.unsubscribe()
    // We should have 5 calls: first find + 4 events
    assert.equal(callCount1, 5);
    assert.equal(callCount2, 5);
  }).timeout(5000);
});
