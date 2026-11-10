// Çalıştır: node --test tests/kademe.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('../kademe.js');
const T=[{min:200,pct:15},{min:100,pct:10},{min:300,pct:20}];

test('ilk kademeye kadar 0 dan ilerler',()=>{
 assert.deepEqual(K.progress(0,T),{pct:0,next:{min:100,pct:10},left:100,ratio:0});
 assert.deepEqual(K.progress(60,T),{pct:0,next:{min:100,pct:10},left:40,ratio:60});
});

test('kademe geçilince bir sonrakine göre ilerler',()=>{
 assert.deepEqual(K.progress(100,T),{pct:10,next:{min:200,pct:15},left:100,ratio:0});
 assert.deepEqual(K.progress(250,T),{pct:15,next:{min:300,pct:20},left:50,ratio:50});
});

test('en üst kademede tamamlanmış sayılır, kademe yoksa null',()=>{
 assert.deepEqual(K.progress(420,T),{pct:20,next:null,left:0,ratio:100});
 assert.equal(K.progress(5,[]),null);
});
