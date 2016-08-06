# feathers-reactive

[![Build Status](https://travis-ci.org/feathersjs/feathers-reactive.png?branch=master)](https://travis-ci.org/feathersjs/feathers-reactive)

> Reactive API extensions for Feathers

## About

`feathers-reactive` turns a [Feathers service](http://docs.feathersjs.com/services/readme.html) call into an [RxJS](https://github.com/Reactive-Extensions/RxJS) observables that automatically updates on [real-time events](http://docs.feathersjs.com/real-time/events.html).

## Options

The following options are supported:

- `idField` (default: `id`): The id property field of your services
- `dataField` (default: `data`): The data property field in paginated responses
- `listStrategy` (default: `smart`): The strategy to use for streaming the data. Can be `smart`, `always` or `never`
- `merge` (`function(current, data){}`): A function that merges the current and new data
- `sorter` (`function(query, options) {}`): A function that returns a sorting function for the given query and option including pagination and limiting. Does not need to be customized unless there is a sorting mechanism other than Feathers standard in place.
- `matcher` (`function(query)`): A function that returns a function which returns whether an item matches the original query or not.

### Setting options and RxJS

An instance of RxJS has to be passed as the first parameter when configuring the plugin on the application. Other options can be set on the application, service and method call level (and will be merged in that order):

#### Application level

```js
const feathers = require('feathers');
const reactive = require('feathers-reactive');
const RxJS = require('rxjs');

const app = feathers().configure(reactive(RxJS, options));
```

#### Service level

With `feathers-reactive` configured on the application individual options can be set at the service level with `service.rx`:

```js
// Set a different id field and always re-fetch data
app.service('todos').rx({
  idField: '_id'
});
```

#### Method call level

Each method call can also pass its own options via `params.rx`:

```js
// Disable the reactive extensions for this call
app.service('todos').find({ rx: false });
// Always fetch fresh data for this method call
app.service('todos').find({ listStrategy: 'always' });
```

### List strategies

List strategies are used to determine how a data stream behaves. Currently there are three strategies:

- `never` - Returns a stream from the service promise that only emits the method call data and never updates after that
- `smart` (default) - Returns a stream that smartly emits updated list data based on the services real-time events. It does not re-query any new data (but does not cover some cases in which the `always` strategy can be used).
- `always` - Re-runs the original query to always get fresh data from the server on any matching real-time event.

## Usage

```js
const feathers = require('feathers');
const memory = require('feathers-memory');
const rx = require('feathers-reactive');
const RxJS = require('rxjs');

const app = feathers()
  .configure(rx(RxJS))
  .use('/messages', memory());

const messages = app.service('messages');

messages.create({
  text: 'A test message'
}).then(() => {
  // Get a specific message with id 0. Emit the message data once it resolves
  // and every time it changes e.g. through an updated or patched event
  messages.get(0).subscribe(message => console.log('My message', message));

  // Find all messages and emit a new list every time anything changes
  messages.find().subscribe(messages => console.log('Message list', messages));

  setTimeout(() => {
    messages.create({ text: 'Another message' }).then(() =>
      setTimeout(() => messages.patch(0, { text: 'Updated message' }), 1000)
    );
  }, 1000);
});
```

Will output:

```
My message { text: 'A test message', id: 0 }
Message list [ { text: 'A test message', id: 0 } ]
Message list [ { text: 'A test message', id: 0 },
  { text: 'Another message', id: 1 } ]
My message { text: 'Updated message', id: 0 }
Message list [ { text: 'Updated message', id: 0 },
  { text: 'Another message', id: 1 } ]
```

## Frameworks

Let's assume a simple server in `app.js` like this:

> npm install feathers feathers-socketio feathers-memory feathers-errors/handler

```js
const feathers = require('feathers');
const socketio = require('feathers-socketio');
const memory = require('feathers-memory');
const handler = require('feathers-errors/handler');

const app = feathers()
  .configure(socketio())
  .use('/todos', memory())
  .use('/', feathers.static(__dirname))
  .use(handler());

app.listen(3030);
````

### React

A real-time ReactJS Todo application (with Bootstrap styles) can look like this (see the [examples/react-todos](./examples/react-todos) folder for a working example);

> npm install react react-dom rxjs

```js
import React from 'react';
import ReactDOM from 'react-dom';
import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import rx from 'feathers-reactive';
import RxJS from 'rxjs';

const socket = io();
const app = feathers()
  .configure(socketio(socket))
  .configure(rx(RxJS));
const todos = app.service('todos');

const TodoApp = React.createClass({
  getInitialState() {
    return {
      todos: [],
      text: ''
    };
  },

  componentDidMount() {
    this.todos = todos.find().subscribe(todos => this.setState({ todos }));
  },

  componentWillUnmount() {
    this.todos.unsubscribe();
  },

  updateText(ev) {
    this.setState({ text: ev.target.value });
  },

  createTodo(ev) {
    todos.create({
      text: this.state.text,
      complete: false
    });
    this.setState({ text: '' });
    ev.preventDefault();
  },

  updateTodo(todo, ev) {
    todo.complete = ev.target.checked;
    todos.patch(todo.id, todo);
  },

  deleteTodo(todo) {
    todos.remove(todo.id);
  },

  render() {
    const renderTodo = todo =>
      <li className={`page-header checkbox ${todo.complete ? 'done' : ''}`}>
        <label>
          <input type="checkbox" onChange={this.updateTodo.bind(this, todo)}
            checked={todo.complete} />
          {todo.text}
        </label>
        <a href="javascript://" className="pull-right delete"
            onClick={this.deleteTodo.bind(this, todo)}>
          <span className="glyphicon glyphicon-remove"></span>
        </a>
      </li>;

    return <div className="container" id="todos">
      <h1>Feathers real-time Todos</h1>

      <ul className="todos list-unstyled">{this.state.todos.map(renderTodo)}</ul>
      <form role="form" className="create-todo" onSubmit={this.createTodo}>
        <div className="form-group">
          <input type="text" className="form-control" name="description"
            placeholder="Add a new Todo" onChange={this.updateText}
            value={this.state.text} />
        </div>
        <button type="submit" className="btn btn-info col-md-12">
          Add Todo
        </button>
      </form>
    </div>;
  }
});

ReactDOM.render(<TodoApp />, document.getElementById('app'));
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
