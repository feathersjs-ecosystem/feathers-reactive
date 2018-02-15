# Change Log

## [v0.6.0](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.6.0) (2018-02-15)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.5.4...v0.6.0)

**Closed issues:**

- Using feathers reactive with rxjs 5.5.x breaks angular production builds \(build optimizing\) [\#96](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/96)
- Cannot find module 'feathers' when using @feathersjs/client [\#83](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/83)
- Error: The RxJS instance does not seem to provide an `Observable` type. [\#81](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/81)
- Caching is broken with rxjs 5.5.0 [\#77](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/77)
- Update rxjs to 5.5 [\#76](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/76)
- subscribing to query with $populate does not see any updates even with listStrategy=always [\#60](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/60)
- Subscriptions with $client query parameters are not reactive [\#56](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/56)
- Subscriptions with $contains and $search are not reactive [\#53](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/53)

**Merged pull requests:**

- Make options.pipe take single or multiple operators, fix typings. [\#98](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/98) ([j2L4e](https://github.com/j2L4e))
- Omit all $ top level properties and export sift instance [\#97](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/97) ([daffl](https://github.com/daffl))
- buzzard, rxjs 5.5 [\#95](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/95) ([j2L4e](https://github.com/j2L4e))
- Update browserify to the latest version 🚀 [\#94](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/94) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update mocha to the latest version 🚀 [\#91](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/91) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Support disablePagination\(\) hook [\#90](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/90) ([psi-4ward](https://github.com/psi-4ward))
- Remove rxjs import from 0.5 configuration example [\#89](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/89) ([hubgit](https://github.com/hubgit))
- Update browserify to the latest version 🚀 [\#87](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/87) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update semistandard to the latest version 🚀 [\#86](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/86) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))

## [v0.5.4](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.5.4) (2017-10-27)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.5.3...v0.5.4)

**Closed issues:**

- patch subscribe fires twice [\#80](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/80)
- feathers-reactive not responding to create event with query applied in .find\(\) \(possibly related to \#62\) [\#73](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/73)
- Link to outdated docs confuses about project state [\#70](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/70)
- Official query syntax for $gt, $gte does not work [\#62](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/62)

**Merged pull requests:**

- Update dependencies to enable Greenkeeper 🌴 [\#79](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/79) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Fix TypeScript declarations [\#78](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/78) ([rybaczewa](https://github.com/rybaczewa))
- Updated README to include querying example and stress importance of providing the correct variable type. [\#75](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/75) ([jobobo21](https://github.com/jobobo21))
- Adding the mandatory idField to the usage example [\#74](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/74) ([johnlindquist](https://github.com/johnlindquist))
- Update mocha to the latest version 🚀 [\#72](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/72) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))

## [v0.5.3](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.5.3) (2017-09-25)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.5.2...v0.5.3)

**Merged pull requests:**

- \[typings\] make Service and ReactiveService generic types default to any [\#69](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/69) ([j2L4e](https://github.com/j2L4e))

## [v0.5.2](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.5.2) (2017-09-06)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.5.1...v0.5.2)

**Closed issues:**

- Mixin of watch function into feathers service not working [\#67](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/67)

**Merged pull requests:**

- add mixin.watch\(\) workaround for firefox [\#68](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/68) ([j2L4e](https://github.com/j2L4e))

## [v0.5.1](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.5.1) (2017-08-30)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.5.0...v0.5.1)

**Closed issues:**

- Cannot find module 'feathers-reactive'. [\#52](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/52)
- Observable.throw\(\) is not subscribable [\#47](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/47)
- Impossible to type [\#41](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/41)
- previous data lost when patch/remove with listStrategy='smart' [\#37](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/37)

**Merged pull requests:**

- Fix index reference [\#66](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/66) ([daffl](https://github.com/daffl))
- Add 0.5 migration guide to readme [\#65](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/65) ([j2L4e](https://github.com/j2L4e))

## [v0.5.0](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.5.0) (2017-08-28)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.4.1...v0.5.0)

**Closed issues:**

- Get idField from service.id if available [\#59](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/59)
- Is there a way to update query params? [\#39](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/39)

**Merged pull requests:**

- Adding missing import for Socket.io to React section of readme [\#64](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/64) ([corymsmith](https://github.com/corymsmith))
- Update debug to the latest version 🚀 [\#63](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/63) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Move reactive functions to service\(...\).watch\(\), use rxjs5 [\#58](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/58) ([j2L4e](https://github.com/j2L4e))
- Update semistandard to the latest version 🚀 [\#55](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/55) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update feathers-hooks to the latest version 🚀 [\#54](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/54) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update dependencies to enable Greenkeeper 🌴 [\#51](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/51) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update browserify to version 14.1.0 🚀 [\#46](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/46) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v0.4.1](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.4.1) (2016-11-30)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.4.0...v0.4.1)

**Merged pull requests:**

- Update all dependencies 🌴 [\#38](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/38) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- jshint —\> semistandard [\#36](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/36) ([corymsmith](https://github.com/corymsmith))

## [v0.4.0](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.4.0) (2016-09-05)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.3.2...v0.4.0)

**Closed issues:**

- Other methods should delay until subscription as well [\#31](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/31)
- Paginated metadata should be updated [\#24](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/24)
- find\(\) shouldn't be executed before subscribing [\#20](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/20)

**Merged pull requests:**

- Implement lazy subscription mode [\#34](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/34) ([daffl](https://github.com/daffl))
- Smart list strategy updates paginated metadata [\#33](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/33) ([daffl](https://github.com/daffl))

## [v0.3.2](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.3.2) (2016-09-02)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.3.1...v0.3.2)

**Closed issues:**

- requests performed multiple times [\#29](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/29)

**Merged pull requests:**

- Test and fix for find being called only once [\#30](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/30) ([daffl](https://github.com/daffl))
- Update README.md [\#28](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/28) ([danielang](https://github.com/danielang))

## [v0.3.1](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.3.1) (2016-08-14)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.3.0...v0.3.1)

**Closed issues:**

- listStrategy doesn't work as mentioned in readme [\#26](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/26)
- find\(\) with query [\#25](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/25)
- Outstanding issues [\#11](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/11)

**Merged pull requests:**

- Update the list strategy for any kind of options [\#27](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/27) ([daffl](https://github.com/daffl))

## [v0.3.0](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.3.0) (2016-08-06)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.2.0...v0.3.0)

**Closed issues:**

- Merge doesn't work? [\#19](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/19)
- Several issues on 'update' [\#18](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/18)
- Problems with React Native [\#16](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/16)
- React example missing componentWillUnmount [\#14](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/14)

**Merged pull requests:**

- Remove data merging option [\#23](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/23) ([daffl](https://github.com/daffl))
- Customize sorter and matcher [\#22](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/22) ([daffl](https://github.com/daffl))
- make find\(\) query on subscription [\#21](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/21) ([j2L4e](https://github.com/j2L4e))
- Update README.md [\#17](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/17) ([aminmeyghani](https://github.com/aminmeyghani))
- missed reference npm in react-todos [\#15](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/15) ([johnny4young](https://github.com/johnny4young))

## [v0.2.0](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.2.0) (2016-05-24)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.1.1...v0.2.0)

**Merged pull requests:**

- Rename to feathers-reactive [\#13](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/13) ([daffl](https://github.com/daffl))
- Remove direct RxJS dependency and have it passed to the plugin [\#12](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/12) ([daffl](https://github.com/daffl))

## [v0.1.1](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.1.1) (2016-05-16)
[Full Changelog](https://github.com/feathersjs-ecosystem/feathers-reactive/compare/v0.1.0...v0.1.1)

**Closed issues:**

- Publish to NPM [\#8](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/8)
- Feature Request: Browserify feathers-rx for angular2 [\#3](https://github.com/feathersjs-ecosystem/feathers-reactive/issues/3)

## [v0.1.0](https://github.com/feathersjs-ecosystem/feathers-reactive/tree/v0.1.0) (2016-05-16)
**Merged pull requests:**

- Finalize for first beta release [\#10](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/10) ([daffl](https://github.com/daffl))
- Think I fixed the race condition [\#9](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/9) ([harangue](https://github.com/harangue))
- Strategy [\#7](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/7) ([daffl](https://github.com/daffl))
- Revert "Added Strategy support" [\#6](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/6) ([daffl](https://github.com/daffl))
- Pagination [\#5](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/5) ([harangue](https://github.com/harangue))
- Id field [\#4](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/4) ([harangue](https://github.com/harangue))
- Added Strategy support [\#2](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/2) ([harangue](https://github.com/harangue))
- Switched to RxJS 5, fixed tests, rimraf [\#1](https://github.com/feathersjs-ecosystem/feathers-reactive/pull/1) ([harangue](https://github.com/harangue))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*