const express = require('express')
const app = express()
const bodyParser= require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session')
const { ObjectId } = require('mongodb')
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.ggtwbdl.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(에러, client){
    //연결되면 할일
    if (에러) return console.log(에러)

    db = client.db('todoapp');
   
    app.listen(3000, function() {
        console.log('listening on 3000')
    });
});


app.get('/', 로그인했니, function(요청, 응답){
  //디비에 저장된 post라는 collection안의 모든 데이터를 꺼내주세요
  db.collection('post').find().toArray(function(에러, 결과){
       console.log(결과);
       응답.render('list.ejs', { posts : 결과 });
  });    
});

app.get('/write', 로그인했니,function(요청, 응답) { 
    응답.render('write.ejs', { 사용자 : 요청.user })
});

app.get('/home', function(요청, 응답) {
    응답.redirect('/');
})


app.get('/list', 로그인했니, function(요청, 응답){
    //디비에 저장된 post라는 collection안의 모든 데이터를 꺼내주세요
    db.collection('post').find().toArray(function(에러, 결과){
         console.log(결과);
         응답.render('list.ejs', { posts : 결과 });
    });    
});

app.post('/deletePost', 로그인했니, function(요청, 응답){

   if(요청.user.id == 요청.body.작성자){ 
   db.collection('post').deleteOne({ 작성자이름 : 요청.body.작성자 }, function(에러, 결과){
      if(에러){return console.log(에러)}
      console.log("삭제완료");
      응답.write("<script>alert('Deleted successfully!')</script>");
      응답.write("<script>window.location=\"/list\"</script>"); 
   })
  }
  else{
    응답.write("<script>alert('Not your Post!!!')</script>");
    응답.write("<script>window.location=\"/list\"</script>");
  }
   
});

app.get('/detail/:id', 로그인했니, function(요청, 응답){
    db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){
      if(에러){return console.log(에러)}  
      console.log(결과); 
      응답.render('detail.ejs', { data : 결과 } );
    })
  });
  
app.get('/edit/:id/:user', 로그인했니, function(요청, 응답){
      db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){
        if(요청.params.user == 요청.user.id)
         응답.render('edit.ejs', { post : 결과 });
        else{
          응답.write("<script>alert('Not your Post!!!')</script>");
          응답.write("<script>window.location=\"/list\"</script>");
        }
    })
  })

  app.get('/reply/:id', 로그인했니, function(요청, 응답){
    db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){   // parseInt(요청.params.id)는 글번호
      응답.render('replyForm.ejs', { data : 결과 })
    })
  })

  app.get('/replyView/:id', 로그인했니, function(요청, 응답){
    db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){   // parseInt(요청.params.id)는 글번호
      db.collection('reply').find({ 게시글번호 : 요청.params.id }).toArray((에러2, 결과2) => {
        if(에러2) {return console.log(에러2)}
        console.log(결과2)
        응답.render('replyPost.ejs', { data : 결과, replys : 결과2 })
      })
    })
  })
  
  app.get('/replyResult', 로그인했니, function(요청, 응답){
    db.collection('post').findOne({ _id : parseInt(요청.query.id) }, function(에러1, 결과1){
      if(에러1){return console.log(에러1)}

      db.collection('reply').find({ 게시글번호 : 요청.query.id }).toArray((에러2, 결과2) => {
        if(에러2) {return console.log(에러2)}
        console.log(결과2)
        응답.render('replyPost.ejs', { data : 결과1, replys : 결과2 })
      })
  
    })
  })

  app.post('/replySubmit', 로그인했니, function(요청, 응답){
    
      db.collection('reply').insertOne({ 게시글번호: 요청.body.id, 작성자 : 요청.user.id, 댓글내용: 요청.body.content, 작성시간: new Date() }, function(에러2, reply추가){
        if(에러2){return console.log(에러2)}
        console.log(reply추가)
      })
      응답.redirect('/replyResult/?id=' + 요청.body.id) 
    
  })

  app.put('/edit', function(요청, 응답){
     db.collection('post').updateOne({ _id : parseInt(요청.body.id) }, { $set : { 제목: 요청.body.title, 날짜: 요청.body.date, 내용: 요청.body.content } }, function(에러, 결과){
        console.log('수정완료')
        응답.redirect('/list')
     })
  });

  app.get('/login', function(요청, 응답){
     응답.render('login.ejs')
  });

  app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
  }), function(요청, 응답){
     응답.redirect('/')
 });

 app.get('/fail',function(요청, 응답){
   응답.write("<script>alert('Please Checking ID or Password')</script>");
   응답.write("<script>window.location=\"/login\"</script>")
 })

  app.get('/mypage', 로그인했니, function (요청, 응답) {
    console.log(요청.user)
    응답.render('mypage.ejs', {사용자 : 요청.user})
  })
  
  app.get('/mypageEditor', 로그인했니, function(요청, 응답){
    응답.render('mypageEditor.ejs', {사용자 : 요청.user})
  })

  app.put('/myedit',로그인했니, function(요청, 응답){
    db.collection('login').updateOne({ _id : 요청.user._id }, { $set : { id: 요청.body.id, email: 요청.body.email, pw: 요청.body.pw } }, function(에러, 결과){
       console.log('수정완료')
       응답.redirect('/mypage')
    })
 });

  function 로그인했니(요청, 응답, next) { 
    if (요청.user) { 
      next() 
    } 
    else { 
      //응답.send('로그인을 안 하셨습니다.')
      응답.write("<script>alert('Wrong approach. Please log in !!!')</script>");
      응답.write("<script>window.location=\"/login\"</script>") 
    } 
  } 


 passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재 하지 않는 아이디 입니다.' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비밀번호가 틀렸습니다.' })
      }
    })
  }));

  passport.serializeUser(function (user, done) {
    done(null, user.id)   //user.id = 아이디
  });
  
  passport.deserializeUser(function (아이디, done) {  //user.id = 아이디
    db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
      done(null, 결과)  //결과 = { id:test, pwd:test }
    })
  });
  
  app.get('/logout', function(요청, 응답){
    요청.session.destroy(function(에러){
        console.log(에러)
    })
    응답.redirect('/login')
  })
  
  app.get('/register', function(요청, 응답){
     응답.render('register.ejs');
  })

  app.post('/register', function(요청, 응답){
    db.collection('login').insertOne( { id : 요청.body.id, pw : 요청.body.pw, email : 요청.body.email }, function(에러, 결과){
        응답.redirect('/login')
    } )
  })
  
  app.post('/chatroom',로그인했니, function(요청, 응답){

    var 저장할거 = {
      title : 요청.body.제목,
      member : [ObjectId(요청.body.당한사람id), 요청.user._id],
      date : new Date()
    }
  
    db.collection('chatroom').insertOne(저장할거).then(function(결과){
      응답.send('저장완료')
    });
  });

  app.get('/chat', 로그인했니, function(요청, 응답){ 

    db.collection('chatroom').find({ member : 요청.user._id }).toArray().then((결과)=>{
      console.log(결과);
      응답.render('chat.ejs', {data : 결과})
    })
  }); 

  app.post('/message', 로그인했니, function(요청, 응답){

    var 저장할거 = {
      parent : 요청.body.parent,
      content : 요청.body.content,
      userid : 요청.user._id,
      date : new Date()
    }

    db.collection('message').insertOne(저장할거).then(()=>{
        console.log('DB저장성공')
        응답.send('DB저장성공')
    })
  })

  app.get('/message/:id', 로그인했니, function(요청, 응답){

    응답.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
  
    db.collection('message').find({ parent : 요청.params.id }).toArray()
    .then((결과)=>{
      응답.write('event: test\n');
      응답.write('data: ' + JSON.stringify(결과) + '\n\n');
    })
  
     const pipeline = [
       { $match: { 'fullDocument.parent' : 요청.params.id } } 
     ];
     const collection = db.collection('message');
     const changeStream = collection.watch(pipeline);
     changeStream.on('change', (result)=>{
      응답.write('event: test\n');
      응답.write('data: ' + JSON.stringify([result.fullDocument]) + '\n\n');
     });

  });
   
//DB에 글저장하는 코드
app.post('/add', function(요청, 응답){
  //응답.send('전송완료')
  db.collection('counter').findOne({ name : '게시물갯수' }, function(에러, 결과){
      console.log(결과.totalPost)
      var 총게시물갯수 = 결과.totalPost;
      
      var 저장할거 = { _id : 총게시물갯수 + 1, 작성자 : 요청.user._id, 제목 : 요청.body.title, 날짜 : 요청.body.date, 작성자이름 : 요청.body.name, 내용 : 요청.body.content }

      db.collection('post').insertOne(저장할거 , function(에러, 결과){
        console.log('저장완료');
        //counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜야함 (수정)
        db.collection('counter').updateOne({name:'게시물갯수'},{ $inc : {totalPost:1} },function(에러, 결과){
            if(에러){return console.log(에러)}
            응답.redirect('/list')
        })
    }); 
  });
     
});
 
  app.get('/search', 로그인했니, (요청, 응답) => {

    var 검색조건 = [
      {
        $search: {
          index: 'titleSearch',
          text: {
            query: 요청.query.value,
            path: ['제목', '날짜', '작성자이름']  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
          }
        }
      },
      { $sort : { _id : 1 } },
      { $limit : 10 },
    ] 
     
     db.collection('post').aggregate(검색조건).toArray((에러, 결과) => {
        if(에러){return console.log(에러)}
        console.log(결과)
        응답.render('search.ejs', { posts : 결과 })
     }) 
  })
   


