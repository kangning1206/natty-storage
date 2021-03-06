"use strict";

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-storage')已被`webpack`映射到全局`NattyDB`对象
const nattyStorage = require('natty-storage');

const s1MB = require('./1m');
const s1KB = require('./1k');

let count = 1;
let getId = function () {
    return count++;
}

let _describe = function () {};

let VERSION;
__BUILD_VERSION__

describe('nattyStorage v' + VERSION + ' Unit Test', function() {

    describe('static',function() {
        it('version v' + VERSION, function() {
            expect(nattyStorage.version).to.equal(VERSION);
        });
    });

    // describe('environment',function() {
    //     this.timeout(1000*60*5);
    //     it.skip('support localStorage: ' + nattyStorage.support.localStorage);
    //     it.skip('support sessionStorage: ' + nattyStorage.support.sessionStorage);
    //     it('support', function () {
    //         expect(nattyStorage.support.localStorage).to.be.a('boolean');
    //         expect(nattyStorage.support.sessionStorage).to.be.a('boolean');
    //     });
    //
    //     let checkMax = function (type, cb) {
    //         let ls = nattyStorage({
    //             async: true,
    //             type: type,
    //             key: 'big'
    //         });
    //
    //         let startMB = s1MB + s1MB + s1MB;
    //         let s100KB = '';
    //         for (let i=1, l=100; i<=l; i++) {
    //             s100KB += s1KB;
    //         }
    //
    //         let s10KB = '';
    //         for (let i=1, l=10; i<=l; i++) {
    //             s10KB += s1KB;
    //         }
    //
    //         let data = startMB;
    //
    //
    //         let setMore100KB = function(){
    //             data += s100KB;
    //             // console.log('add 100KB: ', (data.length/1024).toFixed(2) + 'KB');
    //             return ls.set('x', data);
    //         };
    //
    //         let setMore10KB = function(){
    //             data += s10KB;
    //             // console.log('add 10KB: ', (data.length/1024).toFixed(2) + 'KB');
    //             return ls.set('x', data);
    //         };
    //
    //         let mb = function (data) {
    //             return (data.length/1024/1024).toFixed(2) + 'MB';
    //         };
    //
    //
    //         let i = 1;
    //         let p = Promise.resolve();
    //         while(i<30){
    //             i++;
    //             p = p.then(setMore100KB);
    //         }
    //         p.then(function () {
    //             cb('> ' + mb(data));
    //             ls.destroy();
    //         }).catch(function () {
    //             let ii = 1;
    //             let pp = Promise.resolve();
    //             while(ii<50){
    //                 ii++;
    //                 pp = pp.then(setMore10KB);
    //             }
    //             pp.then(function () {
    //                 cb('> ' +  mb(data));
    //                 ls.destroy();
    //             }).catch(function () {
    //                 cb(mb(data));
    //                 ls.destroy();
    //             });
    //         });
    //     };
    //
    //     // 找出最大容量
    //     setTimeout(function () {
    //         checkMax('localStorage', function (max) {
    //             document.getElementById('maxLS').innerHTML = max;
    //             // done();
    //         });
    //         checkMax('sessionStorage', function (max) {
    //             document.getElementById('maxSS').innerHTML = max;
    //             // done();
    //         });
    //     }, 1000);
    // });

    describe('localStorage', function() {
        this.timeout(1000*10);

        describe('initialize', function () {
            it('as soon as possiable with lazy init', function (done) {
                let bigData = s1MB + s1MB;
                let ls = nattyStorage({
                    async: true,
                    key: 'big-data'
                });
                ls.set('x',bigData).then(function () {
                    try {
                        // 统计ls2的创建时间
                        let startTime = +new Date();

                        let ls2 = nattyStorage({
                            async: true,
                            key: 'big-data'
                        });
                        let endTime = +new Date();
                        // console.log(endTime - startTime);

                        expect(endTime - startTime).to.below(3);
                        ls.destroy();
                        done();
                    } catch (e) {
                        done(e);
                    }
                }).catch(function (e) {
                    console.error(e);
                });
            });


            it('create storage instance with existed data', function(done){
                let id = getId();
                let ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: id // 保证之前不存在
                });

                ls.set('x', 'x').then(function () {
                    let ls2 = nattyStorage({
                        async: true,
                        type: 'localStorage',
                        key: id // 保证之前存在
                    });

                    ls2.get().then(function (data) {
                        try {
                            expect(JSON.stringify(data)).to.be('{"x":"x"}');
                            ls.destroy();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                });
            });
        });

        describe('validity checking', function() {

            it('tag checking: invalid', function(done){
                let id = getId();
                let ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: id, // 保证之前不存在
                    tag: '1.0'
                });

                ls.set('x', 'x').then(function () {
                    // 版本过期
                    let ls2 = nattyStorage({
                        async: true,
                        type: 'localStorage',
                        key: id, // 保证之前存在
                        tag: '2.0'
                    });

                    ls2.get().then(function (data) {
                        try {
                            expect(JSON.stringify(data)).to.be('{}');
                            ls.destroy();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                });
            });


            it('id checking: valid', function(done) {
                let id = getId();
                let ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: id, // 保证之前不存在
                    tag: '1.0'
                });

                let value = {x:'x'};
                ls.set(value).then(function () {
                    // 版本不过期
                    let ls2 = nattyStorage({
                        async: true,
                        type: 'localStorage',
                        key: id, // 保证之前存在
                        tag: '1.0'
                    });

                    ls2.get().then(function (data) {
                        try {
                            expect(JSON.stringify(data)).to.be(JSON.stringify(value));
                            ls.destroy();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                });
            });

            it('check `lastUpdate` is updated when an new storage was initialized', function (done) {
                let id = 'test-last-update';
                let ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: id,
                    duration: 200
                });

                // 这里的调用一次`get`是为了调用一次内部的`_lazyInit`方法
                ls.get().then(function () {

                    // 未过期的情况下, 创建新的`storage`时, 会顺延有效期
                    setTimeout(function () {
                        let ls2 = nattyStorage({
                            async: true,
                            type: 'localStorage',
                            key: id,
                            duration: 300
                        });
                        ls2.get().then(function () {
                            try {
                                expect(ls2._checkData.lastUpdate - ls._checkData.lastUpdate).to.be.above(40);
                                ls.destroy();
                                done();
                            } catch (e) {
                                done(e);
                            }
                        })
                    }, 50);
                });

            });

            it('create storage with expire checking', function (done) {
                let id = 'test-expire';
                let ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: id,
                    duration: 200
                });
                ls.set('x', 'x');

                // 过期
                setTimeout(function () {
                    let ls3 = nattyStorage({
                        async: true,
                        type: 'localStorage',
                        key: id,
                        duration: 300
                    });

                    ls3.get().then(function (data) {
                        try {
                            expect(JSON.stringify(data)).to.be('{}');
                            ls.destroy();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                }, 300);
            });

            it('valid until checking: invalid', function (done) {
                let id = 'test-valid-until';
                let ls = nattyStorage({
                    async: true,
                    key: id,
                    until: 1464246015932
                });

                ls.set('x', 'x').then(function () {
                    let ls2 = nattyStorage({
                        async: true,
                        key: id,
                        until: 1464246015932
                    });
                    ls2.get().then(function (data) {
                        try {
                            expect(JSON.stringify(data)).to.be('{}');
                            ls.destroy();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    })
                });
            });


            it('valid until checking: valid', function (done) {
                let id = 'test-valid-until';
                let ls = nattyStorage({
                    async: true,
                    key: id,
                    until: Date.now() + 1000*60*60
                });

                ls.set('x', 'x').then(function () {
                    let ls2 = nattyStorage({
                        async: true,
                        key: id
                    });
                    ls2.get().then(function (data) {
                        try {
                            expect(JSON.stringify(data)).to.be('{"x":"x"}');
                            ls.destroy();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    })
                });
            });

        });

        describe('set/get async:true', function() {

            let ls;

            beforeEach('reset', function () {
                ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach('clear', function () {
                ls.destroy();
            });

            it('set pure string value without `key`', function (done) {
                let value = 'foo';
                ls.set(value);
                ls.get().then(function (data) {
                    try {
                        expect(data).to.be(value);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('set pure string value with `key`', function (done) {
                let value = 'x';
                ls.set('x', value);
                ls.get('x').then(function (data) {
                    try {
                        expect(data).to.be(value);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('set value with `path`', function (done) {
                let value = 'x';
                ls.set('x.y', value);
                ls.get('x').then(function (data) {
                    try {
                        expect(data.y).to.be(value);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('set/get value with `path:\\\.`', function (done) {
                let value = 'x';
                ls.set('x.y\\.y.z', value);
                ls.get('x.y\\.y').then(function (data) {
                    try {
                        expect(data.z).to.be(value);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('set path value with merging', function (done) {
                ls.set({
                    x: {
                        y: 'y'
                    }
                });

                // x 应该同时有 y 和 z
                ls.set('x.z', 'z');
                ls.get('x').then(function (data) {
                    try {
                        expect(data.y).to.be('y');
                        expect(data.z).to.be('z');
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('set path value with override', function (done) {
                ls.set({
                    x: {
                        y: {
                            z: 'z'
                        }
                    }
                });

                // 原 y 对应的对象值将被覆盖
                ls.set('x.y', 'y');
                ls.get('x.y').then(function (data) {
                    try {
                        expect(data).to.be('y');
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('set undefined', function (done) {
                ls.set('x', undefined);
                // 此时
                // `storage`里对应的值的"{}"
                // 而`ls._data`的值是 {x: undefined}
                // `JSON.stringify`会删除值为`undefined`的键
                ls.get().then(function (data) {
                    try {
                        expect(JSON.stringify(data)).to.be("{}");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('setting invalid value should throw an error', function (done) {
                ls.set('x', 'x');
                ls.set('x.y', 'y').then(function () {

                }).catch(function (e) {
                    try {
                        expect(e.message).to.contain('on non-object value');
                        done();
                    } catch (e2) {
                        done(e2)
                    }
                });
            });

        });

        describe('set/get async:false', function() {

            let ls;

            beforeEach('reset', function () {
                ls = nattyStorage({
                    async: false,
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach('clear', function () {
                ls.destroy();
            });

            it('set pure string value without `key`', function () {
                let value = 'foo';
                ls.set(value);
                let data = ls.get();
                expect(data).to.be(value);
            });

            it('set pure string value with `key`', function () {
                let value = 'x';
                ls.set('x', value);
                let data = ls.get('x');
                expect(data).to.be(value);
            });

            it('set value with `path`', function () {
                let value = 'x';
                ls.set('x.y', value);
                let data = ls.get('x')
                expect(data.y).to.be(value);
            });

            it('set/get value with `path:\\\.`', function () {
                let value = 'x';
                ls.set('x.y\\.y.z', value);
                let data = ls.get('x.y\\.y');
                expect(data.z).to.be(value);
            });

            it('set path value with merging', function () {
                ls.set({
                    x: {
                        y: 'y'
                    }
                });

                // x 应该同时有 y 和 z
                ls.set('x.z', 'z');
                let data = ls.get('x');
                expect(data.y).to.be('y');
                expect(data.z).to.be('z');
            });

            it('set path value with override', function () {
                ls.set({
                    x: {
                        y: {
                            z: 'z'
                        }
                    }
                });

                // 原 y 对应的对象值将被覆盖
                ls.set('x.y', 'y');
                let data = ls.get('x.y');
                expect(data).to.be('y');
            });

            it('set undefined', function () {
                ls.set('x', undefined);
                // 此时
                // `storage`里对应的值的"{}"
                // 而`ls._data`的值是 {x: undefined}
                // `JSON.stringify`会删除值为`undefined`的键
                let data = ls.get();
                expect(JSON.stringify(data)).to.be("{}");
            });

            it('setting invalid value should throw an error', function () {
                ls.set('x', 'x');
                let setWrongValue = function() {
                    return ls.set('x.y', 'y');
                }
                expect(setWrongValue).to.throwError();
            });
        });


        describe('has async: true', function () {
            let ls;

            beforeEach('reset', function () {
                ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach('clear', function () {
                ls.destroy();
            });

            it('has value with inner placeholder used', function (done) {
                ls.set('x').then(function () {
                    ls.has().then(function (result) {
                        try {
                            expect(result.value).to.be('x');
                            done();
                        } catch (e) {
                            done(e);
                        }
                    }).catch(function (e) {
                        done(e)
                    });
                }).catch(function (e) {
                    done(e)
                })
            });

            it('has no value with inner placeholder used', function (done) {
                ls.has().then(function (result) {
                    try {
                        expect(result.hasOwnProperty('value')).to.be(false);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }).catch(function (e) {
                    done(e)
                });
            });

            it('has value without inner placeholder used', function (done) {
                ls.set('x', 'x').then(function () {
                    ls.has().then(function (result) {
                        // 走不到这里
                    }).catch(function (e) {
                        try {
                            expect(e instanceof Error).to.be(true);
                            done();
                        } catch (e2) {
                            done(e2)
                        }
                    });
                }).catch(function (e) {
                    done(e)
                })
            });

            it('has value by `path` without inner placeholder used', function (done) {
                ls.set('x', 'x').then(function () {
                    ls.has('x').then(function (result) {
                        try {
                            expect(result.value).to.be('x');
                            done();
                        } catch (e) {
                            done(e)
                        }
                    }).catch(function (e) {
                        done(e)
                    });
                }).catch(function (e) {
                    done(e)
                })
            });

            it('has no value by `path` without inner placeholder used', function (done) {
                ls.set('x', 'x').then(function () {
                    ls.has('y').then(function (result) {
                        try {
                            expect(result.hasOwnProperty('value')).to.be(false);
                            done();
                        } catch (e) {
                            done(e)
                        }
                    }).catch(function (e) {
                        done(e)
                    });
                }).catch(function (e) {
                    done(e)
                })
            });

            it('has value by `deep path` without inner placeholder used', function (done) {
                ls.set('x.y', 'y').then(function () {
                    ls.has('x').then(function (result) {
                        try {
                            expect(result.value.y).to.be('y');
                            done();
                        } catch (e) {
                            done(e)
                        }
                    }).catch(function (e) {
                        done(e)
                    });
                }).catch(function (e) {
                    done(e)
                })
            });

            it('has no value by `deep path` without inner placeholder used', function (done) {
                ls.set('x.y', 'y').then(function () {
                    ls.has('x.y.z').then(function (result) {
                        try {
                            expect(result.hasOwnProperty('value')).to.be(false);
                            done();
                        } catch (e) {
                            done(e)
                        }
                    }).catch(function (e) {
                        done(e)
                    });
                }).catch(function (e) {
                    done(e)
                })
            });
        });

        describe('has async: false', function () {
            let ls;

            beforeEach('reset', function () {
                ls = nattyStorage({
                    async: false,
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach('clear', function () {
                ls.destroy();
            });

            it('has value with inner placeholder used', function () {
                ls.set('x');
                let result = ls.has();
                expect(result.value).to.be('x');
            });

            it('has no value with inner placeholder used', function () {
                let result = ls.has();
                expect(result.hasOwnProperty('value')).to.be(false);
            });

            it('has value without inner placeholder used', function () {
                ls.set('x', 'x');
                let hasErrorFn = function () {
                    ls.has();
                }
                expect(hasErrorFn).to.throwError();
            });

            it('has value by `path` without inner placeholder used', function () {
                ls.set('x', 'x');
                let result = ls.has('x');
                expect(result.value).to.be('x');
            });

            it('has no value by `path` without inner placeholder used', function () {
                ls.set('x', 'x');
                let result = ls.has('y');
                expect(result.hasOwnProperty('value')).to.be(false);
            });

            it('has value by `deep path` without inner placeholder used', function () {
                ls.set('x.y', 'y');
                let result = ls.has('x');
                expect(result.value.y).to.be('y');
            });

            it('has no value by `deep path` without inner placeholder used', function () {
                ls.set('x.y', 'y');
                let result = ls.has('x.y.z');
                expect(result.hasOwnProperty('value')).to.be(false);
            });
        });

        describe('remove', function () {

            let ls;
            let value = {
                x: {
                    y: {
                        z: 'z',
                        zz: 'zz'
                    }
                }
            };

            beforeEach('reset', function () {
                ls = nattyStorage({
                    async: true,
                    type: 'localStorage',
                    key: 'foo'
                });
            });

            afterEach(function () {
                ls.destroy();
            });

            it('remove partial data by path', function(done) {
                ls.set(value);
                ls.remove('x.y.z');
                ls.get('x.y').then(function (data) {
                    try {
                        expect(data.zz).to.be('zz');
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('remove complete data by path', function (done) {
                ls.set(value);
                ls.remove('x.y');
                ls.get('x').then(function (data) {
                    try {
                        expect(JSON.stringify(data)).to.be('{}');
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('remove by a un-existed path', function (done) {
                ls.set(value);
                ls.remove('x.y.foo');
                ls.get().then(function (data) {
                    try {
                        expect(JSON.stringify(data)).to.be(JSON.stringify(data));
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('remove all data', function (done) {
                ls.set(value);
                ls.remove();
                ls.get().then(function (data) {
                    try {
                        expect(JSON.stringify(data)).to.be('{}');
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });
});
