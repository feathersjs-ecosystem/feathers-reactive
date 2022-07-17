import assert from 'assert';
import { feathers } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';
import socketioClient from '@feathersjs/socketio-client';
import io from 'socket.io-client';
import memory from 'feathers-memory';
import { firstValueFrom } from 'rxjs';
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

    let callCount = 0;
    const listener = client.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} })
      .subscribe(messages => {
        assert.ok(messages);
        callCount++;
      });

    const message = await client.service('messages').create({
      text: 'A test message'
    });
    await client.service('messages').patch(message.id, {
      text: 'A patched test message'
    });
    await client.service('messages').update(message.id, {
      id: message.id,
      text: 'An updated test message'
    });
    await client.service('messages').remove(message.id);
    listener.unsubscribe();
    // We should have 5 calls: first find + 4 events
    assert.equal(callCount, 5);
  });

  it('works with a client Feathers app listening for service operations', async () => {
    const socket = io('http://localhost:3030');
    const client = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));

    let callCount = 0;
    const find = client.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} });
    const listener = find.subscribe(messages => {
      assert.ok(messages);
      callCount++;
    });

    // We need to wait for the first (empty list) response to avoid timing issues
    await firstValueFrom(find);

    const message = await app.service('messages').create({
      text: 'A test message'
    });

    await app.service('messages').patch(message.id, {
      text: 'A patched test message'
    });
    await app.service('messages').update(message.id, {
      id: 1,
      text: 'An updated test message'
    });

    await app.service('messages').remove(message.id);

    await new Promise(resolve => setTimeout(resolve, 1000));

    listener.unsubscribe();
    // We should have 5 calls: first find + 4 events
    assert.equal(callCount, 5);
  });

  it('works with multiple client Feathers apps', async () => {
    const socket = io('http://localhost:3030');
    const client1 = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));
    const client2 = feathers()
      .configure(socketioClient(socket))
      .configure(rx({ idField: 'id' }));

    let callCount1 = 0;
    let callCount2 = 0;

    const find1 = client1.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} });
    const listener1 = find1.subscribe(messages => {
      assert.ok(messages);
      callCount1++;
    });
    const find2 = client2.service('messages')
      .watch({ listStrategy: 'smart' })
      .find({ query: {} });
    const listener2 = find2.subscribe(messages => {
      assert.ok(messages);
      callCount2++;
    });

    // Wait for the first find results to return
    await firstValueFrom(find1);
    await firstValueFrom(find2);

    const message = await client1.service('messages').create({
      text: 'A test message'
    });

    await client1.service('messages').patch(message.id, {
      text: 'A patched test message'
    });

    await client2.service('messages').update(message.id, {
      id: 2,
      text: 'An updated test message'
    });

    await client2.service('messages').remove(message.id);

    listener1.unsubscribe();
    listener2.unsubscribe();
    // We should have 5 calls: first find + 4 events
    assert.equal(callCount1, 5);
    assert.equal(callCount2, 5);
  });
});
