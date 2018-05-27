import React, { Component } from 'react';
import client from './feathers';

class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      todos: [],
      text: ''
    };
  }

  componentDidMount () {
    this.todos = client.service('todos').watch()
      .find().subscribe(todos => this.setState(todos));
  }

  componentWillUnmount () {
    this.todos.unsubscribe();
  }

  updateText (ev) {
    this.setState({ text: ev.target.value });
  }

  createTodo (ev) {
    client.service('todos').create({
      text: this.state.text,
      complete: false
    });
    this.setState({ text: '' });
    ev.preventDefault();
  }

  updateTodo (todo, ev) {
    todo.complete = ev.target.checked;
    client.service('todos').patch(todo.id, todo);
  }

  deleteTodo (todo) {
    client.service('todos').remove(todo.id);
  }

  render () {
    const renderTodo = todo =>
      <li key={todo.id} className={`page-header checkbox ${todo.complete ? 'done' : ''}`}>
        <label>
          <input type='checkbox' onChange={this.updateTodo.bind(this, todo)}
            checked={todo.complete} />
          {todo.text}
        </label>
        <a href='javascript://' className='pull-right delete'
          onClick={this.deleteTodo.bind(this, todo)}>
          <span className='glyphicon glyphicon-remove' />
        </a>
      </li>;

    return <div className='container' id='todos'>
      <h1>Feathers real-time Todos</h1>

      <ul className='todos list-unstyled'>{this.state.todos.map(renderTodo)}</ul>
      <form role='form' className='create-todo' onSubmit={this.createTodo.bind(this)}>
        <div className='form-group'>
          <input type='text' className='form-control' name='description'
            placeholder='Add a new Todo' onChange={this.updateText.bind(this)}
            value={this.state.text} />
        </div>
        <button type='submit' className='btn btn-info col-md-12'>
          Add Todo
        </button>
      </form>
    </div>;
  }
}

export default App;
