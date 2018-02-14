## Migration from <= 0.4 to 0.5

If you're upgrading from 0.4 and below this is going to totally break your setup. Sorry for that!
Let's get you back on track:

#### configuration

0.4:
```js
const reactive = require('feathers-reactive');
const Rx = require('rxjs');
// ...
app.configure(reactive(Rx, { ...options }));
```
0.5:
```js
const reactive = require('feathers-reactive');
// ...
app.configure(reactive({ idField: 'id' /* depends on your DB */ , ...options }));
```
No need to import the entire RxJS bundle and pass it to feathers-reactive any longer. However, `idField` has become a mandatory option. Check the __Options__ section below.

#### getting an observable result stream

This is where 0.5's `.watch()` method comes into play. Depending on your configuration, with 0.4 and lower your service calls could return either an Observable or a Promise. As of 0.5 the plain service call remains a Promise at all times:
0.4:
```js
app.service('myService').get(someId);
```
0.5:
```js
app.service('myService').get(someId);         // This always returns a Promise
app.service('myService').watch().get(someId); // This always returns an Observable
```
#### passing options per service call

You can pass service call level options into the `.watch()` function now. This isn't breaking though, as using options.rx is equivalent.
0.4:
```js
app.service('myService').get(someId, {rx: { strategy: 'always' }});
```
0.5:
```js
app.service('myService').watch({ strategy: 'always' }).get(someId);         // 0.5 syntax
app.service('myService').watch().get(someId, {rx: { strategy: 'always' }}); // still functional 0.4 syntax.
```

#### 0.5 Observables are always lazy!

Unless you configured `lazy: true` in 0.4's options, 0.4's Observables would be always hot, i.e. show Promise-like behavior. This is no longer the case! Observables returned by `.watch().<method>()` are always cold! Example:
```js
// this service call will not be executed!
app.service('myService').watch().create(someObject);

// unless you subscribe:
app.service('myService').watch().create(someObject).subscribe(result => console.log(result));
```
If you just want to fire-and-forget (i.e., you don't care about the result) use the non-observable service call.